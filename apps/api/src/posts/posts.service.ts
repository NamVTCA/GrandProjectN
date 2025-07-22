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
import { ReactToPostDto } from './dto/react-to-post.dto';
import { RepostDto } from './dto/repost.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

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

    if (isVideoPost && createPostDto.mediaUrls) {
      this.eventEmitter.emit('post.video.uploaded', {
        postId: savedPost._id,
        videoPath: createPostDto.mediaUrls[0],
      });
    }

    if (createPostDto.groupId) {
      const XP_PER_POST = 10;
      await this.groupsService.addXpToMember(
        user._id.toString(),
        createPostDto.groupId,
        XP_PER_POST,
      );
    }

    // FIX: Populate trực tiếp đối tượng vừa lưu
    await savedPost.populate({ path: 'author', select: 'username avatar' });
    return savedPost;
  }

  async findAllPosts(): Promise<Post[]> {
    return this.postModel
      .find({
        moderationStatus: {
          $in: [ModerationStatus.APPROVED, ModerationStatus.PROCESSING],
        },
      })
      .populate('author', 'username avatar')
      .populate({
        path: 'repostOf',
        populate: {
          path: 'author',
          select: 'username avatar',
        },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findPostById(id: string): Promise<Post> {
    const post = await this.postModel
      .findById(id)
      .populate('author', 'username avatar')
      .populate({
        path: 'repostOf',
        populate: {
          path: 'author',
          select: 'username avatar',
        },
      })
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
  ): Promise<Comment> {
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

    const savedComment = await newComment.save();
    await savedComment.populate({ path: 'author', select: 'username avatar' });
    return savedComment;
  }

  async findCommentsByPost(postId: string): Promise<Comment[]> {
    return this.commentModel
      .find({ post: postId, moderationStatus: ModerationStatus.APPROVED })
      .populate('author', 'username avatar')
      .sort({ createdAt: 'asc' })
      .exec();
  }

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
      if (post.reactions[existingReactionIndex].type === reactionType) {
        post.reactions.splice(existingReactionIndex, 1);
      } else {
        post.reactions[existingReactionIndex].type = reactionType;
      }
    } else {
      post.reactions.push({ user: user._id as any, type: reactionType });

      if (post.author.toString() !== user._id.toString()) {
        await this.notificationsService.createNotification(
            post.author as UserDocument,
            user,
            NotificationType.NEW_REACTION,
            `/posts/${post._id}`,
        );
      }
    }

    const updatedPost = await post.save();
    
    // FIX: Populate trực tiếp đối tượng vừa lưu để đảm bảo dữ liệu đầy đủ
    await updatedPost.populate([
        { path: 'author', select: 'username avatar' },
        { path: 'repostOf', populate: { path: 'author', select: 'username avatar' } }
    ]);

    return updatedPost;
  }

  async repost(
    originalPostId: string,
    user: UserDocument,
    repostDto: RepostDto,
  ): Promise<Post> {
    const originalPost = await this.postModel.findById(originalPostId);
    if (!originalPost) {
      throw new NotFoundException('Không tìm thấy bài đăng gốc.');
    }

    if (originalPost.repostOf) {
        throw new BadRequestException('Không thể chia sẻ lại một bài đã được chia sẻ.');
    }

    const newRepost = new this.postModel({
      author: user._id,
      content: repostDto.content || '',
      repostOf: originalPostId,
      mediaUrls: [],
      moderationStatus: ModerationStatus.APPROVED,
    });

    const savedRepost = await newRepost.save();

    originalPost.repostCount = (originalPost.repostCount || 0) + 1;
    await originalPost.save();

    // FIX: Populate trực tiếp đối tượng vừa lưu
    await savedRepost.populate([
        { path: 'author', select: 'username avatar' },
        { path: 'repostOf', populate: { path: 'author', select: 'username avatar' } }
    ]);
    return savedRepost;
  }


  async findPostsByAuthor(authorId: string): Promise<Post[]> {
    return this.postModel
      .find({ author: authorId, moderationStatus: ModerationStatus.APPROVED })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .populate({
        path: 'repostOf',
        populate: {
          path: 'author',
          select: 'username avatar',
        },
      })
      .exec();
  }

  async updatePost(postId: string, user: UserDocument, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng.');
    }
    if (post.author.toString() !== user._id.toString()) {
      throw new UnauthorizedException('Bạn không có quyền chỉnh sửa bài đăng này.');
    }

    post.content = updatePostDto.content;
    const updatedPost = await post.save();
    
    // FIX: Populate trực tiếp đối tượng vừa lưu
    await updatedPost.populate([
        { path: 'author', select: 'username avatar' },
        { path: 'repostOf', populate: { path: 'author', select: 'username avatar' } }
    ]);
    return updatedPost;
  }

  async updateComment(commentId: string, user: UserDocument, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận.');
    }
    if (comment.author.toString() !== user._id.toString()) {
      throw new UnauthorizedException('Bạn không có quyền chỉnh sửa bình luận này.');
    }

    comment.content = updateCommentDto.content;
    const savedComment = await comment.save();
    await savedComment.populate({ path: 'author', select: 'username avatar' });
    return savedComment;
  }
}
