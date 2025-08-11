import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Post,
  PostDocument,
  ModerationStatus,
  PostVisibility,
} from './schemas/post.schema';
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
import { UsersService } from 'src/users/users.service';
import { GroupDocument } from '../groups/schemas/group.schema';
@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private notificationsService: NotificationsService,
    private groupsService: GroupsService,
    private moderationService: ModerationService,
    private userService: UsersService,

    private eventEmitter: EventEmitter2,
  ) {}
  async createPost(
    user: UserDocument,
    createPostDto: CreatePostDto,
  ): Promise<Post> {
    // --- XỬ LÝ REPOST ---
    if (createPostDto.repostOf) {
      const originalPost = await this.postModel.findById(
        createPostDto.repostOf,
      );
      if (!originalPost) {
        throw new NotFoundException('Bài viết gốc không tồn tại.');
      }

      const repost = new this.postModel({
        content: createPostDto.content || '',
        author: user._id,
        repostOf: originalPost._id,
        visibility: createPostDto.visibility || 'FRIENDS_ONLY',
        moderationStatus: ModerationStatus.APPROVED,
      });

      originalPost.repostCount += 1;
      await originalPost.save();
      await this.userService.receiveXP(10, 'repost', user.id);
      const savedRepost = await repost.save();

      return savedRepost.populate([
        { path: 'author', select: 'username avatar' },
        {
          path: 'repostOf',
          populate: { path: 'author', select: 'username avatar' },
        },
      ]);
    }

    // --- XỬ LÝ BÀI VIẾT THƯỜNG ---
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
      visibility: createPostDto.visibility || 'PUBLIC',
      moderationStatus: isVideoPost
        ? ModerationStatus.PROCESSING
        : ModerationStatus.APPROVED,
    });

    const savedPost = await newPost.save();

    await this.userService.receiveXP(30, 'createPost', user.id);
    if (isVideoPost && createPostDto.mediaUrls) {
      this.eventEmitter.emit('post.video.uploaded', {
        postId: savedPost._id,
        videoPath: createPostDto.mediaUrls[0],
      });
    }
    if (createPostDto.groupId) {
      await this.groupsService.addXpToMember(
        user._id.toString(),
        createPostDto.groupId,
        10,
      );
    }

    return savedPost.populate({ path: 'author', select: 'username avatar' });
  }

  async findAllForFeed(currentUser: UserDocument): Promise<Post[]> {
    const friendIds = currentUser.friends.map((friend) => friend._id);
    const followingIds = currentUser.following.map(
      (followedUser) => followedUser._id,
    );

    const relevantUserIds = [
      ...new Set([...friendIds, ...followingIds, currentUser._id]),
    ];

    return this.postModel
      .find({
        group: { $exists: false },
        $or: [
          {
            moderationStatus: ModerationStatus.APPROVED,
            visibility: PostVisibility.PUBLIC,
          },
          {
            author: { $in: relevantUserIds },
            moderationStatus: ModerationStatus.APPROVED,
            visibility: {
              $in: [PostVisibility.FRIENDS_ONLY, PostVisibility.PRIVATE],
            },
          },
        ],
      })
      .sort({ createdAt: -1 }) // Thêm sắp xếp theo thời gian mới nhất
      .populate([
        { path: 'author', select: 'username avatar' },
        {
          path: 'repostOf',
          populate: { path: 'author', select: 'username avatar' },
        },
      ])
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
    // B1: Tìm bài viết và "làm đầy" thông tin quan trọng (tác giả và nhóm)
    const post = await this.postModel
      .findById(postId)
      .populate('author')
      .populate('group');

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng.');
    }

    // B2: Xây dựng các quy tắc về quyền hạn
    const isAuthor = post.author._id.toString() === user._id.toString();
    const isGlobalAdmin = user.globalRole === 'ADMIN'; // Giả sử bạn có globalRole

    let isGroupOwner = false;
    if (post.group) {
      // Nếu là bài viết trong nhóm, kiểm tra xem người xóa có phải chủ nhóm không
      // Ghi chú: 'group' đã được populate, nên chúng ta có thể truy cập 'owner'
      const group = post.group as GroupDocument;
      isGroupOwner = group.owner.toString() === user._id.toString();
    }

    // B3: Kiểm tra quyền hạn cuối cùng
    // Cho phép xóa nếu người dùng là: Tác giả, HOẶC Chủ nhóm, HOẶC Admin toàn cục
    if (!isAuthor && !isGroupOwner && !isGlobalAdmin) {
      throw new UnauthorizedException('Bạn không có quyền xóa bài đăng này.');
    }

    // B4: Xóa bài viết và các dữ liệu liên quan
    await this.postModel.findByIdAndDelete(postId);
    await this.commentModel.deleteMany({ post: postId });
    // (Tùy chọn) Thêm logic xóa notifications liên quan đến bài viết này

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
    await this.userService.receiveXP(5, 'comment', user.id);
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

  async toggleReaction(
    postId: string,
    user: UserDocument,
    reactToPostDto: ReactToPostDto,
  ): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng');
    }

    const userId = user._id;
    const reactionType = reactToPostDto.type;
    const existingReactionIndex = post.reactions.findIndex(
      (reaction) => reaction.user.toString() === userId.toString(),
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
    await this.userService.receiveXP(5, 'like', userId.toString());
    const updatedPost = await post.save();

    // FIX: Populate trực tiếp đối tượng vừa lưu để đảm bảo dữ liệu đầy đủ
    await updatedPost.populate([
      { path: 'author', select: 'username avatar' },
      {
        path: 'repostOf',
        populate: { path: 'author', select: 'username avatar' },
      },
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

    // Không cho repost một bài đã là repost
    if (originalPost.repostOf) {
      throw new BadRequestException(
        'Không thể chia sẻ lại một bài đã được chia sẻ.',
      );
    }

    // Kiểm tra nếu originalPost là FRIENDS_ONLY thì user phải là bạn
    if (originalPost.visibility === PostVisibility.FRIENDS_ONLY) {
      const isFriend = user.friends.some(
        (friendId) => friendId.toString() === originalPost.author.toString(),
      );

      if (!isFriend && originalPost.author.toString() !== user._id.toString()) {
        throw new BadRequestException(
          'Bạn không thể chia sẻ bài viết không thuộc bạn bè.',
        );
      }
    }

    const newRepost = new this.postModel({
      author: user._id,
      content: repostDto.content || '',
      repostOf: originalPostId,
      mediaUrls: [],
      moderationStatus: ModerationStatus.APPROVED,
      visibility: PostVisibility.FRIENDS_ONLY, // hoặc repostDto.visibility nếu cho người dùng chọn
    });

    const savedRepost = await newRepost.save();

    // Tăng số lượng repost cho bài gốc
    originalPost.repostCount = (originalPost.repostCount || 0) + 1;
    await originalPost.save();

    // Populate kết quả trả về
    await savedRepost.populate([
      { path: 'author', select: 'username avatar' },
      {
        path: 'repostOf',
        populate: { path: 'author', select: 'username avatar' },
      },
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

  async updatePost(
    postId: string,
    user: UserDocument,
    updatePostDto: UpdatePostDto,
  ): Promise<Post> {
    const post = await this.postModel.findById(postId);
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng.');
    }
    if (post.author.toString() !== user._id.toString()) {
      throw new UnauthorizedException(
        'Bạn không có quyền chỉnh sửa bài đăng này.',
      );
    }

    post.content = updatePostDto.content;
    const updatedPost = await post.save();

    // FIX: Populate trực tiếp đối tượng vừa lưu
    await updatedPost.populate([
      { path: 'author', select: 'username avatar' },
      {
        path: 'repostOf',
        populate: { path: 'author', select: 'username avatar' },
      },
    ]);
    return updatedPost;
  }

  async updateComment(
    commentId: string,
    user: UserDocument,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận.');
    }
    if (comment.author.toString() !== user._id.toString()) {
      throw new UnauthorizedException(
        'Bạn không có quyền chỉnh sửa bình luận này.',
      );
    }

    comment.content = updateCommentDto.content;
    const savedComment = await comment.save();
    await savedComment.populate({ path: 'author', select: 'username avatar' });
    return savedComment;
  }
  async deleteComment(id: string) {
    return await this.commentModel.findByIdAndDelete(id);
  }

  // ✅ BỔ SUNG PHẦN CÒN THIẾU VÀO ĐÂY
  // ✅ HÀM DÀNH RIÊNG CHO TRANG NHÓM
  async findAllByGroup(groupId: string): Promise<Post[]> {
    return this.postModel
      .find({
        // Chỉ lấy các bài viết có groupId khớp
        group: groupId,
        moderationStatus: {
          $in: [ModerationStatus.APPROVED, ModerationStatus.PROCESSING],
        },
      })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar') // <-- Đã sửa thành avatar
      .populate({
        path: 'repostOf',
        populate: { path: 'author', select: 'username avatar' },
      })
      .exec();
  }
}
