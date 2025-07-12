import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from './schemas/group.schema';
import { GroupMember, GroupMemberDocument, GroupRole } from './schemas/group-member.schema';
import { UserDocument } from '../auth/schemas/user.schema';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(GroupMember.name) private groupMemberModel: Model<GroupMemberDocument>,
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
}
