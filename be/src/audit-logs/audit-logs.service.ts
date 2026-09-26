import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { ValidationAppError } from '../common/errors/app-error';
import { ErrorCode } from '../common/errors/error-codes.enum';

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly auditLogsRepository: AuditLogsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(data: {
    postId: string;
    actor: string;
    fromStatus: string;
    toStatus: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    return this.auditLogsRepository.create({
      post: new Types.ObjectId(data.postId),
      actor: data.actor,
      fromStatus: data.fromStatus,
      toStatus: data.toStatus,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: data.metadata,
    });
  }

  async findByPost(postId: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new ValidationAppError(
        ErrorCode.POST_NOT_FOUND,
        `Invalid post ID: "${postId}"`,
      );
    }

    const logs = await this.auditLogsRepository.findByPost(postId);

    const userIds = logs
      .map((l) => l.actor)
      .filter((actor) => Types.ObjectId.isValid(actor));

    const users = await this.usersRepository.findByIds(userIds);

    const userMap = new Map<string, any>(
      users.map((u) => [u._id.toString(), { name: u.name, email: u.email, role: u.role }]),
    );

    return logs.map((log) => {
      const logObj = log.toObject();
      const resolvedUser = userMap.get(log.actor);
      return {
        ...logObj,
        actorInfo: resolvedUser || {
          name: log.actor === 'SYSTEM' ? 'Automated Publishing Job' : 'System',
          role: 'SYSTEM',
        },
      };
    });
  }
}
