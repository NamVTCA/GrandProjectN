// File: src/groups/groups.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
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
  ) {}

  async createGroup(
    owner: UserDocument,
    createGroupDto: CreateGroupDto,
  ): Promise<Group> {
    const newGroup = new this.groupModel({
      name: createGroupDto.name,
      description: createGroupDto.description,
      interests: createGroupDto.interestIds,
      owner: owner._id,
    });
    const savedGroup = await newGroup.save();

    const ownerMembership = new this.groupMemberModel({
      user: owner._id,
      group: savedGroup._id,
      role: GroupRole.OWNER,
    });
    await ownerMembership.save();

    return savedGroup;
  }

  async joinGroup(
    user: UserDocument,
    groupId: string,
  ): Promise<{ message: string }> {
    const group = await this.groupModel.findById(groupId);
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm.');
    }

    // Kiểm tra nếu đã là thành viên
    const existingMembership = await this.groupMemberModel.findOne({
      user: user._id,
      group: groupId,
    });
    if (existingMembership) {
      throw new ConflictException('Bạn đã là thành viên của nhóm này.');
    }

    // Kiểm tra nếu đã gửi yêu cầu
    const existingRequest = await this.joinRequestModel.findOne({
      user: user._id,
      group: groupId,
      status: 'PENDING',
    });
    if (existingRequest) {
      throw new ConflictException('Bạn đã gửi yêu cầu tham gia nhóm này rồi.');
    }

    // Gửi yêu cầu tham gia nhóm
    const joinRequest = new this.joinRequestModel({
      user: user._id,
      group: groupId,
      status: 'PENDING',
    });

    await joinRequest.save();

    return { message: 'Đã gửi yêu cầu tham gia nhóm. Vui lòng chờ phê duyệt.' };
  }

  // ✅ THAY THẾ HOÀN TOÀN HÀM NÀY
  async suggestGroups(user: UserDocument): Promise<Group[]> {
    // B1: Lấy ID của tất cả nhóm người dùng đã tham gia
    const userMemberships = await this.groupMemberModel
      .find({ user: user._id })
      .select('group');
    const userGroupIds = userMemberships.map((m) => m.group);

    // B2: Tìm nhóm gợi ý
    return this.groupModel
      .find({
        interests: { $in: user.interests }, // Có chung sở thích
        _id: { $nin: userGroupIds }, // Và người dùng chưa tham gia
      })
      .populate('owner', 'username avatar')
      .populate('interests')
      .limit(10)
      .exec();
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

  // ✅ THAY THẾ HOÀN TOÀN HÀM NÀY
  async findOneById(id: string): Promise<any> {
    // B1: Lấy thông tin cơ bản của nhóm
    const group = await this.groupModel
      .findById(id)
      .populate('owner', 'username avatar')
      .populate('interests')
      .lean() // Dùng .lean() để biến nó thành object JS thuần túy, dễ chỉnh sửa
      .exec();

    if (!group) {
      throw new NotFoundException(`Không tìm thấy nhóm với ID: ${id}`);
    }

    // B2: Lấy danh sách thành viên từ bảng GroupMember
    const members = await this.groupMemberModel
      .find({ group: id })
      .populate('user', 'username avatar'); // Lấy thông tin chi tiết của từng user

    // B3: Đếm tổng số thành viên
    const memberCount = await this.groupMemberModel.countDocuments({
      group: id,
    });

    // B4: Gộp tất cả dữ liệu lại và trả về cho frontend
    return { ...group, members, memberCount };
  }

  // ✅ BỔ SUNG PHƯƠN THỨC NÀY
  async findGroupsForUser(user: UserDocument): Promise<Group[]> {
    // B1: Tìm các bản ghi thành viên của user
    const memberships = await this.groupMemberModel
      .find({ user: user._id })
      .select('group');
    const groupIds = memberships.map((m) => m.group);

    // B2: Dùng danh sách ID để lấy thông tin chi tiết các nhóm đó
    return this.groupModel
      .find({ _id: { $in: groupIds } })
      .populate('owner', 'username avatar')
      .populate('interests')
      .exec();
  }

  // --- LOGIC QUẢN LÝ ---

  async getJoinRequests(groupId: string): Promise<JoinRequest[]> {
    return this.joinRequestModel
      .find({ group: groupId, status: 'PENDING' })
      .populate('user', 'username avatar');
  }

  async approveRequest(requestId: string): Promise<{ message: string }> {
    const request = await this.joinRequestModel.findById(requestId);
    if (!request || request.status !== 'PENDING') {
      throw new NotFoundException(
        'Không tìm thấy yêu cầu hoặc yêu cầu đã được xử lý.',
      );
    }

    // Tạo bản ghi thành viên mới
    const newMember = new this.groupMemberModel({
      user: request.user,
      group: request.group,
      role: GroupRole.MEMBER,
    });
    await newMember.save();

    // Cập nhật trạng thái yêu cầu
    request.status = 'APPROVED';
    await request.save();

    return { message: 'Đã chấp thuận thành viên.' };
  }

  async rejectRequest(requestId: string): Promise<{ message: string }> {
    const request = await this.joinRequestModel.findByIdAndDelete(requestId);
    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu.');
    }
    return { message: 'Đã từ chối yêu cầu.' };
  }

  async getJoinStatus(
    user: UserDocument,
    groupId: string,
  ): Promise<{ status: 'MEMBER' | 'PENDING' | 'NONE' }> {
    // Kiểm tra đã là thành viên chưa
    const membership = await this.groupMemberModel.findOne({
      user: user._id,
      group: groupId,
    });
    if (membership) return { status: 'MEMBER' };

    // Kiểm tra đã gửi yêu cầu chưa
    const joinRequest = await this.joinRequestModel.findOne({
      user: user._id,
      group: groupId,
      status: 'PENDING',
    });
    if (joinRequest) return { status: 'PENDING' };

    return { status: 'NONE' };
  }

  // ============================================================
  // ✅ CÁC HÀM BỔ SUNG ĐỂ CONTROLLER UPLOAD HOẠT ĐỘNG
  // ============================================================

  // Cập nhật 1 nhóm theo id (dùng chung)
  async updateById(id: string, data: Partial<Group>) {
    const updated = await this.groupModel.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new NotFoundException('Không tìm thấy nhóm.');
    return updated;
  }

  // Đổi ảnh bìa
  async updateCoverImage(id: string, coverImage: string) {
    return this.updateById(id, { coverImage });
  }

  // Đổi avatar
  async updateAvatar(id: string, avatar: string) {
    return this.updateById(id, { avatar });
  }
}
