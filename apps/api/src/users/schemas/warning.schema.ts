import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';

@Schema({ timestamps: true })
export class Warning {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: Types.ObjectId; // người bị cảnh cáo

  @Prop({ required: true })
  reason: string; // lý do cảnh cáo

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  by: Types.ObjectId; // admin hoặc mod thực hiện cảnh cáo

  @Prop({ type: Date, default: Date.now })
  date: Date;

  @Prop({
    type: {
      reason: { type: String },
      postContent: { type: String },
    },
    default: null,
  })
  reportDetails?: {
    reason?: string;
    postContent?: string;
  };
}

export type WarningDocument = Warning & Document;
export const WarningSchema = SchemaFactory.createForClass(Warning);
