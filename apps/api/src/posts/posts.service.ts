import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument, ModerationStatus } from './schemas/post.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UserDocument } from '../auth/schemas/user.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { GroupsService } from '../groups/groups.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModerationService } from '../moderation/moderation.service';
import { ReactToPostDto } from './dto/react-to-post.dto'; // <-- IMPORT DTO MỚI
import { ReactionType } from './schemas/reaction.schema'; // <-- IMPORT ENUM MỚI
import { RepostDto } from './dto/repost.dto'; // <-- IMPORT DTO MỚI

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private notificationsService: NotificationsService,
    private groupsService: GroupsService,
    private moderationService: ModerationService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createPost(
    user: UserDocument,
    createPostDto: CreatePostDto,
  ): Promise<Post> {
    // 1. Kiểm duyệt nội dung văn bản
    const textModeration = await this.moderationService.checkText(
      createPostDto.content,
    );
    if (textModeration.status === ModerationStatus.REJECTED) {
      throw new BadRequestException(
        `Nội dung của bạn không phù hợp: ${textModeration.reason}`,
      );
    }

    const isVideoPost =
      createPostDto.mediaUrls && createPostDto.mediaUrls[0]?.includes('.mp4');

    // 2. Tạo đối tượng bài đăng mới với trạng thái phù hợp
    const newPost = new this.postModel({
      content: createPostDto.content,
      mediaUrls: createPostDto.mediaUrls,
      author: user._id,
      group: createPostDto.groupId,
      moderationStatus: isVideoPost
        ? ModerationStatus.PROCESSING
        : ModerationStatus.APPROVED,
    });

    const savedPost = await newPost.save();

    // 3. Nếu là video, phát ra sự kiện để xử lý ngầm
    if (isVideoPost && createPostDto.mediaUrls) {
      this.eventEmitter.emit('post.video.uploaded', {
        postId: savedPost._id,
        videoPath: createPostDto.mediaUrls[0],
      });
    }

    // 4. Nếu bài đăng thuộc một nhóm, cộng XP
    if (createPostDto.groupId) {
      const XP_PER_POST = 10;
      await this.groupsService.addXpToMember(
        user._id.toString(),
        createPostDto.groupId,
        XP_PER_POST,
      );
    }

    return savedPost;
  }

  async findAllPosts(): Promise<Post[]> {
    // Chỉ hiển thị các bài đăng đã được duyệt hoặc đang xử lý
    return this.postModel
      .find({
        moderationStatus: {
          $in: [ModerationStatus.APPROVED, ModerationStatus.PROCESSING],
        },
      })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findPostById(id: string): Promise<Post> {
    const post = await this.postModel
      .findById(id)
      .populate('author', 'username avatar')
      .exec();
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng');
    }
    return post;
  }

  async deletePost(
    postId: string,
    user: UserDocument,
  ): Promise<{ message: string }> {
    const post = await this.findPostById(postId);
    const authorId =
      typeof post.author === 'object' &&
      post.author !== null &&
      '_id' in post.author
        ? (post.author as any)._id.toString()
        : post.author.toString();
    if (authorId !== user._id.toString()) {
      throw new UnauthorizedException('Bạn không có quyền xóa bài đăng này.');
    }
    await this.postModel.findByIdAndDelete(postId);
    await this.commentModel.deleteMany({ post: postId });
    return { message: 'Xóa bài đăng thành công.' };
  }

  async addComment(
    postId: string,
    user: UserDocument,
    createCommentDto: CreateCommentDto,
  ) {
    const textModeration = await this.moderationService.checkText(
      createCommentDto.content,
    );
    if (textModeration.status === ModerationStatus.REJECTED) {
      throw new BadRequestException(
        `Bình luận của bạn không phù hợp: ${textModeration.reason}`,
      );
    }

    const post = (await this.findPostById(postId)) as PostDocument;
    const newComment = new this.commentModel({
      ...createCommentDto,
      author: user._id,
      post: postId,
      moderationStatus: ModerationStatus.APPROVED,
    });

    post.commentCount += 1;
    await post.save();

    await this.notificationsService.createNotification(
      post.author as UserDocument,
      user,
      NotificationType.NEW_COMMENT,
      `/posts/${post._id}`,
    );

    return newComment.save();
  }

  async findCommentsByPost(postId: string) {
    return this.commentModel
      .find({ post: postId, moderationStatus: ModerationStatus.APPROVED })
      .populate('author', 'username avatar')
      .sort({ createdAt: 'asc' })
      .exec();
  }

// --- HÀM CŨ `toggleLike` ĐƯỢC THAY THẾ BẰNG HÀM MỚI `toggleReaction` ---
  async toggleReaction(postId: string, user: UserDocument, reactToPostDto: ReactToPostDto): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng');
    }

    const userId = user._id;
    const reactionType = reactToPostDto.type;
    const existingReactionIndex = post.reactions.findIndex(
      (reaction) => reaction.user.toString() === userId.toString()
    );

    if (existingReactionIndex > -1) {
      // Nếu người dùng đã react
      if (post.reactions[existingReactionIndex].type === reactionType) {
        // Nếu react lại với cùng loại -> Bỏ react
        post.reactions.splice(existingReactionIndex, 1);
      } else {
        // Nếu react với loại khác -> Cập nhật lại reaction
        post.reactions[existingReactionIndex].type = reactionType;
      }
    } else {
      // Nếu người dùng chưa react -> Thêm reaction mới
      post.reactions.push({ user, type: reactionType });

      // Chỉ gửi thông báo khi có reaction mới, không gửi khi thay đổi loại reaction
      await this.notificationsService.createNotification(
        post.author as UserDocument,
        user,
        NotificationType.NEW_REACTION, // <-- Đổi loại thông báo
        `/posts/${post._id}`,
      );
    }

    return post.save();
  }

 // --- NÂNG CẤP HÀM REPOST ---
  async repost(
    originalPostId: string,
    user: UserDocument,
    repostDto: RepostDto, // <-- Sử dụng DTO mới
  ): Promise<Post> {
    const originalPost = await this.postModel.findById(originalPostId);
    if (!originalPost) {
      throw new NotFoundException('Không tìm thấy bài đăng gốc.');
    }

    // Không cho phép chia sẻ lại một bài đã là bài chia sẻ
    if (originalPost.repostOf) {
        throw new BadRequestException('Không thể chia sẻ lại một bài đã được chia sẻ.');
    }

    const newRepost = new this.postModel({
      author: user._id,
      content: repostDto.content || '', // <-- Lấy nội dung từ DTO
      repostOf: originalPostId,
    });

    // Tăng số lượt chia sẻ của bài gốc
    originalPost.repostCount = (originalPost.repostCount || 0) + 1;
    await originalPost.save();

    return newRepost.save();
  }


  async findPostsByAuthor(authorId: string): Promise<Post[]> {
    return this.postModel
      .find({ author: authorId, moderationStatus: ModerationStatus.APPROVED }) // Chỉ lấy bài đã duyệt
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .exec();
  }
}
