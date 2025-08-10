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

  // ======================================
  // TẠO NHÓM
  // ======================================
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

  // ======================================
  // THAM GIA NHÓM
  // ======================================
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

  // Rời nhóm
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

  // Mời vào nhóm
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

  // Gợi ý nhóm
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

  // Lấy chi tiết nhóm + members
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

  // Kick thành viên
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

  // Lấy các nhóm của user
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

  // Lấy danh sách yêu cầu tham gia (pending)
  async getJoinRequests(groupId: string) {
    return this.joinRequestModel
      .find({ group: groupId, status: 'PENDING' })
      .populate('user', 'username avatar');
  }

  // Duyệt yêu cầu (có owner để notify)
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

  // Từ chối yêu cầu (có owner để notify)
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

  // Lấy danh sách thành viên (cho trang quản lý)
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return this.groupMemberModel
      .find({ group: groupId })
      .populate('user', 'username avatar');
  }

  // Trạng thái tham gia của user đối với nhóm
  async getJoinStatus(
    user: UserDocument,
    groupId: string,
  ): Promise<{ status: 'MEMBER' | 'PENDING' | 'NONE' }> {
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

  // XP cho thành viên
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

  // Xóa nhóm (kèm dữ liệu liên quan)
  async deleteGroup(
    groupId: string,
    user: UserDocument,
  ): Promise<{ message: string }> {
    const group = await this.groupModel.findById(groupId);
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm.');
    }

    const userRole = user.globalRole;

    if (
      group.owner.toString() !== user._id.toString() &&
      userRole !== GlobalRole.ADMIN
    ) {
      throw new UnauthorizedException('Bạn không có quyền xóa nhóm này.');
    }

    const postsInGroup = await this.postModel
      .find({ group: groupId })
      .select('_id')
      .exec();
    const postIds = postsInGroup.map((p) => p._id);

    if (postIds.length > 0) {
      await this.commentModel.deleteMany({ post: { $in: postIds } });
    }

    await this.postModel.deleteMany({ group: groupId });
    await this.groupMemberModel.deleteMany({ group: groupId });
    await group.deleteOne();

    return { message: 'Đã xóa nhóm và tất cả dữ liệu liên quan thành công.' };
  }

  // ============================================================
  // HỖ TRỢ UPDATE ẢNH (cho controller upload)
  // ============================================================
  async updateById(id: string, data: Partial<Group>) {
    const updated = await this.groupModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!updated) throw new NotFoundException('Không tìm thấy nhóm.');
    return updated;
  }

  async updateCoverImage(id: string, coverImage: string) {
    return this.updateById(id, { coverImage });
  }

  async updateAvatar(id: string, avatar: string) {
    return this.updateById(id, { avatar });
  }
}
