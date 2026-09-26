import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';

@Injectable()
export class AuditLogsRepository {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(data: {
    post: Types.ObjectId;
    actor: string;
    fromStatus: string;
    toStatus: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<AuditLogDocument> {
    const entry = new this.auditLogModel({
      ...data,
      timestamp: new Date(),
    });
    return entry.save();
  }

  async findByPost(postId: string): Promise<AuditLogDocument[]> {
    if (!Types.ObjectId.isValid(postId)) return [];
    return this.auditLogModel
      .find({ post: new Types.ObjectId(postId) })
      .sort({ timestamp: 1 })
      .exec();
  }
}
