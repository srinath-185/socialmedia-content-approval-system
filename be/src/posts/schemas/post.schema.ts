import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Platform } from '../../common/enums/platform.enum';
import { PostStatus } from '../../common/enums/post-status.enum';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: Types.ObjectId, ref: 'Client', required: true, index: true })
  client: Types.ObjectId;

  @Prop({ required: true, enum: Platform })
  platform: Platform;

  @Prop({ required: true, trim: true })
  caption: string;

  @Prop({ type: Date, default: null })
  scheduledAt: Date | null;

  @Prop({
    required: true,
    enum: PostStatus,
    default: PostStatus.DRAFT,
    index: true,
  })
  status: PostStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({ default: 1 })
  version: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Compound index for scheduling conflict rule: same client + same platform + scheduled time range
PostSchema.index({ client: 1, platform: 1, scheduledAt: 1 });
