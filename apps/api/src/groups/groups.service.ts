import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from './schemas/group.schema';
import {
  GroupMember,
  GroupMemberDocument,
  GroupRole,
} from './schemas/group-member.schema';
import { User, UserDocument, GlobalRole } from '../auth/schemas/user.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Comment, CommentDocument } from '../posts/schemas/comment.schema';
import {
  JoinRequest,
  JoinRequestDocument,
} from './schemas/join-request.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType } from '../notifications/schemas/notification.schema';
import {
  GroupInvite,
  GroupInviteDocument,
} from './schemas/group-invite.schema';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(GroupMember.name)
    private groupMemberModel: Model<GroupMemberDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(JoinRequest.name)
    private joinRequestModel: Model<JoinRequestDocument>,
    @InjectModel(GroupInvite.name)
    private groupInviteModel: Model<GroupInviteDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createGroup(
    owner: UserDocument,
    createGroupDto: CreateGroupDto,
  ): Promise<Group> {
    const newGroup = new this.groupModel({
      ...createGroupDto,
      owner: owner._id,
      interests: createGroupDto.interestIds,
    });

    const savedGroup = await newGroup.save();

    await new this.groupMemberModel({
      user: owner._id,
      group: savedGroup._id,
      role: GroupRole.OWNER,
    }).save();

    return savedGroup;
  }

  async joinGroup(
    user: UserDocument,
    groupId: string,
  ): Promise<{ message: string }> {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Không tìm thấy nhóm.');

    const existingMembership = await this.groupMemberModel.findOne({
      user: user._id,
      group: groupId,
    });
    if (existingMembership)
      throw new ConflictException('Bạn đã là thành viên của nhóm này.');

    const existingRequest = await this.joinRequestModel.findOne({
      user: user._id,
      group: groupId,
      status: 'PENDING',
    });
    if (existingRequest)
      throw new ConflictException('Bạn đã gửi yêu cầu tham gia nhóm này rồi.');

    if (group.privacy === 'public') {
      await new this.groupMemberModel({
        user: user._id,
        group: groupId,
        role: GroupRole.MEMBER,
      }).save();
      return { message: 'Đã tham gia nhóm thành công.' };
    }

    await new this.joinRequestModel({
      user: user._id,
      group: groupId,
      status: 'PENDING',
    }).save();

    return { message: 'Đã gửi yêu cầu tham gia nhóm. Vui lòng chờ phê duyệt.' };
  }

  async leaveGroup(user: UserDocument, groupId: string) {
    const membership = await this.groupMemberModel.findOne({
      user: user._id,
      group: groupId,
    });
    if (!membership)
      throw new NotFoundException('Bạn không phải là thành viên của nhóm này.');
    if (membership.role === GroupRole.OWNER)
      throw new BadRequestException(
        'Chủ nhóm không thể rời đi. Bạn cần xóa nhóm hoặc chuyển quyền sở hữu.',
      );

    await membership.deleteOne();
    return this.findOneById(groupId);
  }

  async createInvite(
    groupId: string,
    inviter: UserDocument,
    inviteeId: string,
  ): Promise<GroupInvite> {
    const invitee = await this.userModel.findById(inviteeId);
    if (!invitee)
      throw new NotFoundException('Không tìm thấy người dùng bạn muốn mời.');

    const isAlreadyMember = await this.groupMemberModel.findOne({
      user: inviteeId,
      group: groupId,
    });
    if (isAlreadyMember)
      throw new ConflictException('Người này đã là thành viên của nhóm.');

    const existingInvite = await this.groupInviteModel.findOne({
      group: groupId,
      invitee: inviteeId,
      status: 'PENDING',
    });
    if (existingInvite)
      throw new ConflictException('Bạn đã mời người này vào nhóm rồi.');

    const savedInvite = await new this.groupInviteModel({
      group: groupId,
      inviter: inviter._id,
      invitee: inviteeId,
    }).save();

    this.eventEmitter.emit('notification.create', {
      recipientId: inviteeId,
      actor: inviter,
      type: NotificationType.GROUP_INVITE,
      link: `/invites`,
    });

    return savedInvite;
  }

  async suggestGroups(user: UserDocument): Promise<Group[]> {
    const userMemberships = await this.groupMemberModel
      .find({ user: user._id })
      .select('group');
    const userGroupIds = userMemberships.map((m) => m.group);

    return this.groupModel
      .find({
        interests: { $in: user.interests },
        privacy: 'public',
        _id: { $nin: userGroupIds },
      })
      .populate('owner', 'username avatar')
      .populate('interests')
      .limit(10)
      .exec();
  }

  async findOneById(id: string) {
    const group = await this.groupModel
      .findById(id)
      .populate('owner', 'username avatar')
      .populate('interests')
      .lean()
      .exec();
    if (!group)
      throw new NotFoundException(`Không tìm thấy nhóm với ID: ${id}`);

    const members = await this.groupMemberModel
      .find({ group: id })
      .populate('user', 'username avatar');
    const memberCount = await this.groupMemberModel.countDocuments({
      group: id,
    });

    return { ...group, members, memberCount };
  }

  async kickMember(groupId: string, memberUserId: string) {
    const membership = await this.groupMemberModel.findOne({
      group: groupId,
      user: memberUserId,
    });
    if (!membership)
      throw new NotFoundException('Không tìm thấy thành viên này trong nhóm.');
    if (membership.role === GroupRole.OWNER)
      throw new BadRequestException('Không thể xóa chủ sở hữu nhóm.');

    await membership.deleteOne();
    return { message: 'Đã xóa thành viên khỏi nhóm.' };
  }

  async findGroupsForUser(user: UserDocument): Promise<Group[]> {
    const memberships = await this.groupMemberModel
      .find({ user: user._id })
      .select('group');
    const groupIds = memberships.map((m) => m.group);

    return this.groupModel
      .find({ _id: { $in: groupIds } })
      .populate('owner', 'username avatar')
      .populate('interests')
      .exec();
  }

  async getJoinRequests(groupId: string) {
    return this.joinRequestModel
      .find({ group: groupId, status: 'PENDING' })
      .populate('user', 'username avatar');
  }

  async approveRequest(requestId: string, owner: UserDocument) {
    const request = await this.joinRequestModel
      .findById(requestId)
      .populate('user')
      .populate('group');
    if (!request || request.status !== 'PENDING')
      throw new NotFoundException(
        'Không tìm thấy yêu cầu hoặc yêu cầu đã được xử lý.',
      );

    await new this.groupMemberModel({
      user: request.user._id,
      group: request.group._id,
      role: GroupRole.MEMBER,
    }).save();

    await request.deleteOne();

    this.eventEmitter.emit('notification.create', {
      recipientId: request.user._id.toString(),
      actor: owner,
      type: NotificationType.GROUP_REQUEST_ACCEPTED,
      link: `/groups/${request.group._id}`,
    });

    return { message: 'Đã chấp thuận thành viên.' };
  }

  async rejectRequest(requestId: string, owner: UserDocument) {
    const request = await this.joinRequestModel
      .findById(requestId)
      .populate('user')
      .populate('group');
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu.');

    await request.deleteOne();

    this.eventEmitter.emit('notification.create', {
      recipientId: request.user._id.toString(),
      actor: owner,
      type: NotificationType.GROUP_REQUEST_REJECTED,
      link: null,
    });

    return { message: 'Đã từ chối yêu cầu.' };
  }
  async addXpToMember(
    userId: string,
    groupId: string,
    xpAmount: number,
  ): Promise<void> {
    await this.groupMemberModel.findOneAndUpdate(
      { user: userId, group: groupId },
      { $inc: { xp: xpAmount } },
    );
  }

  // --- HÀM MỚI (ĐÃ SỬA LỖI VÀ HOÀN THIỆN) ---
  async deleteGroup(
    groupId: string,
    user: UserDocument,
  ): Promise<{ message: string }> {
    const group = await this.groupModel.findById(groupId);
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm.');
    }

    // SỬA LỖI: Truy cập trực tiếp vào thuộc tính `globalRole` từ đối tượng `user`.
    // TypeScript có thể không suy luận được kiểu phức tạp, nhưng chúng ta biết thuộc tính này tồn tại.
    const userRole = user.globalRole;

    // Kiểm tra quyền: phải là chủ nhóm hoặc Admin
    if (
      group.owner.toString() !== user._id.toString() &&
      userRole !== GlobalRole.ADMIN
    ) {
      throw new UnauthorizedException('Bạn không có quyền xóa nhóm này.');
    }

    // === Xóa toàn bộ dữ liệu liên quan ===

    // 1. Tìm tất cả bài đăng trong nhóm
    const postsInGroup = await this.postModel
      .find({ group: groupId })
      .select('_id')
      .exec();
    const postIds = postsInGroup.map((p) => p._id);

    // 2. Xóa tất cả bình luận thuộc các bài đăng đó
    if (postIds.length > 0) {
      await this.commentModel.deleteMany({ post: { $in: postIds } });
    }

    // 3. Xóa tất cả các bài đăng đó
    await this.postModel.deleteMany({ group: groupId });

    // 4. Xóa tất cả các bản ghi thành viên của nhóm
    await this.groupMemberModel.deleteMany({ group: groupId });

    // 5. Xóa nhóm
    await group.deleteOne();

    return { message: 'Đã xóa nhóm và tất cả dữ liệu liên quan thành công.' };
  }

  // ✅ BỔ SUNG HÀM LẤY DANH SÁCH THÀNH VIÊN
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return this.groupMemberModel
      .find({ group: groupId })
      .populate('user', 'username avatar');
  }

  async getJoinStatus(user: UserDocument, groupId: string) {
    const membership = await this.groupMemberModel.findOne({
      user: user._id,
      group: groupId,
    });
    if (membership) return { status: 'MEMBER' };

    const joinRequest = await this.joinRequestModel.findOne({
      user: user._id,
      group: groupId,
      status: 'PENDING',
    });
    if (joinRequest) return { status: 'PENDING' };

    return { status: 'NONE' };
  }
}
