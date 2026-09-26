import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClientDocument = Client & Document;

@Schema({ timestamps: true })
export class Client {
  @Prop({ required: true, unique: true, trim: true, index: true })
  brandName: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  reviewers: Types.ObjectId[];
}

export const ClientSchema = SchemaFactory.createForClass(Client);
