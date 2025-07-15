import { Injectable, NotFoundException, ConflictException,UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from './schemas/group.schema';
import { GroupMember, GroupMemberDocument, GroupRole } from './schemas/group-member.schema';
import { User, UserDocument, GlobalRole } from '../auth/schemas/user.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Comment, CommentDocument } from '../posts/schemas/comment.schema';
import { CreateGroupDto } from './dto/create-group.dto';


@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(GroupMember.name) private groupMemberModel: Model<GroupMemberDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async createGroup(owner: UserDocument, createGroupDto: CreateGroupDto): Promise<Group> {
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

  async joinGroup(user: UserDocument, groupId: string): Promise<GroupMember> {
    const membershipExists = await this.groupMemberModel.findOne({ user: user._id, group: groupId });
    if (membershipExists) {
        throw new ConflictException('Bạn đã là thành viên của nhóm này.');
    }
    const newMember = new this.groupMemberModel({ user: user._id, group: groupId });
    return newMember.save();
  }

  async suggestGroups(user: UserDocument): Promise<Group[]> {
      if (!user.interests || user.interests.length === 0) {
          return []; // Hoặc trả về các nhóm phổ biến nhất
      }
      return this.groupModel.find({ interests: { $in: user.interests } }).populate('interests').limit(10);
  }

  async addXpToMember(userId: string, groupId: string, xpAmount: number): Promise<void> {
      await this.groupMemberModel.findOneAndUpdate(
          { user: userId, group: groupId },
          { $inc: { xp: xpAmount } },
      );
  }

// --- HÀM MỚI (ĐÃ SỬA LỖI VÀ HOÀN THIỆN) ---
  async deleteGroup(groupId: string, user: UserDocument): Promise<{ message: string }> {
    const group = await this.groupModel.findById(groupId);
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm.');
    }

    // SỬA LỖI: Truy cập trực tiếp vào thuộc tính `globalRole` từ đối tượng `user`.
    // TypeScript có thể không suy luận được kiểu phức tạp, nhưng chúng ta biết thuộc tính này tồn tại.
    const userRole = user.globalRole;

    // Kiểm tra quyền: phải là chủ nhóm hoặc Admin
    if (group.owner.toString() !== user._id.toString() && userRole !== GlobalRole.ADMIN) {
      throw new UnauthorizedException('Bạn không có quyền xóa nhóm này.');
    }

    // === Xóa toàn bộ dữ liệu liên quan ===

    // 1. Tìm tất cả bài đăng trong nhóm
    const postsInGroup = await this.postModel.find({ group: groupId }).select('_id').exec();
    const postIds = postsInGroup.map(p => p._id);

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
}
