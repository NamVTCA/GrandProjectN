import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { Group } from './group.schema';

export type GroupInviteDocument = GroupInvite & Document;

@Schema({ timestamps: true })
export class GroupInvite {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true })
  group: Group; // Nhóm được mời

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  inviter: User; // Người mời

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  invitee: User; // Người được mời

  @Prop({ type: String, enum: ['PENDING', 'ACCEPTED', 'DECLINED'], default: 'PENDING' })
  status: string;
}

export const GroupInviteSchema = SchemaFactory.createForClass(GroupInvite);