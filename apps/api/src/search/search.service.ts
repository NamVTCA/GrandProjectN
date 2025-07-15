// File: apps/api/src/search/search.service.ts (Mới)
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { Group, GroupDocument } from '../groups/schemas/group.schema';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
  ) {}

  async searchAll(query: string): Promise<any> {
    const regex = new RegExp(query, 'i'); // 'i' for case-insensitive

    const users = await this.userModel.find({ username: regex }).limit(5).select('username avatar');
    const posts = await this.postModel.find({ content: regex }).limit(5).populate('author', 'username avatar');
    const groups = await this.groupModel.find({ name: regex }).limit(5);

    return { users, posts, groups };
  }
}
