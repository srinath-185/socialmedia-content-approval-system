import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(data: {
    postId: string;
    actor: string;
    fromStatus: string;
    toStatus: string;
  }) {
    const entry = new this.auditLogModel({
      post: new Types.ObjectId(data.postId),
      actor: data.actor,
      fromStatus: data.fromStatus,
      toStatus: data.toStatus,
      timestamp: new Date(),
    });
    return entry.save();
  }

  async findByPost(postId: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException(`Invalid post ID: "${postId}"`);
    }

    const logs = await this.auditLogModel
      .find({ post: new Types.ObjectId(postId) })
      .sort({ timestamp: 1 })
      .exec();

    // Map logs to resolve user details if actor is a valid ObjectId
    const userIds = logs
      .map((l) => l.actor)
      .filter((actor) => Types.ObjectId.isValid(actor));

    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('name email role')
      .exec();

    const userMap = new Map<string, any>(
      users.map((u) => [u._id.toString(), { name: u.name, email: u.email, role: u.role }]),
    );

    return logs.map((log) => {
      const logObj = log.toObject();
      const resolvedUser = userMap.get(log.actor);
      return {
        ...logObj,
        actorInfo: resolvedUser || { name: log.actor === 'SYSTEM' ? 'Automated Scheduler' : 'System', role: 'SYSTEM' },
      };
    });
  }
}
