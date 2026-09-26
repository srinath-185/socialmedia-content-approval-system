import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: false })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true, index: true })
  post: Types.ObjectId;

  // actor stores User ObjectId string or 'SYSTEM'
  @Prop({ type: String, required: true, index: true })
  actor: string;

  @Prop({ required: true })
  fromStatus: string;

  @Prop({ required: true })
  toStatus: string;

  @Prop({ type: String, default: null })
  ipAddress?: string;

  @Prop({ type: String, default: null })
  userAgent?: string;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;

  @Prop({ type: Date, default: () => new Date(), index: true })
  timestamp: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
