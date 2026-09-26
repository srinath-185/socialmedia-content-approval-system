import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { TransitionPostDto } from './dto/transition-post.dto';
import { PostsRepository } from './repositories/posts.repository';
import { ClientsService } from '../clients/clients.service';
import { CommentsService } from '../comments/comments.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PostStatus, VALID_TRANSITIONS } from '../common/enums/post-status.enum';
import { Platform } from '../common/enums/platform.enum';
import { Role } from '../common/enums/role.enum';
import { CAPTION_LIMITS } from '../common/constants/platform-limits';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import {
  ConflictAppError,
  ForbiddenAppError,
  NotFoundAppError,
  ValidationAppError,
} from '../common/errors/app-error';
import { ErrorCode } from '../common/errors/error-codes.enum';

export interface RequestClientContext {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly clientsService: ClientsService,
    private readonly commentsService: CommentsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  validateCaptionLength(platform: Platform, caption: string): void {
    const limit = CAPTION_LIMITS[platform];
    if (limit && caption.length > limit) {
      throw new ValidationAppError(
        ErrorCode.CAPTION_LIMIT_EXCEEDED,
        `Caption exceeds the maximum character limit for ${platform}. Allowed: ${limit}, provided: ${caption.length}.`,
        { platform, limit, provided: caption.length },
      );
    }
  }

  validateFutureDate(scheduledAt?: string | Date | null): Date | null {
    if (!scheduledAt) return null;
    const date = new Date(scheduledAt);
    if (isNaN(date.getTime())) {
      throw new ValidationAppError(
        ErrorCode.SCHEDULED_TIME_NOT_FUTURE,
        'Invalid scheduledAt date format.',
      );
    }
    if (date <= new Date()) {
      throw new ValidationAppError(
        ErrorCode.SCHEDULED_TIME_NOT_FUTURE,
        'The scheduled time must be in the future.',
        { scheduledAt: date.toISOString(), currentTime: new Date().toISOString() },
      );
    }
    return date;
  }

  async checkSchedulingConflict(
    postId: string | null,
    clientId: string,
    platform: Platform,
    scheduledAt: Date,
  ): Promise<PostDocument | null> {
    return this.postsRepository.findConflictingPost(
      postId,
      clientId,
      platform,
      scheduledAt,
    );
  }

  async create(
    createPostDto: CreatePostDto,
    userId: string,
    clientContext?: RequestClientContext,
  ) {
    // 1. Verify client exists
    await this.clientsService.findOne(createPostDto.client);

    // 2. Validate caption limits
    this.validateCaptionLength(createPostDto.platform, createPostDto.caption);

    // 3. Validate scheduled date is in the future if provided
    const scheduledDate = this.validateFutureDate(createPostDto.scheduledAt);

    // 4. Save new post in DRAFT status with version 1
    const post = await this.postsRepository.create({
      client: new Types.ObjectId(createPostDto.client),
      platform: createPostDto.platform,
      caption: createPostDto.caption.trim(),
      scheduledAt: scheduledDate,
      status: PostStatus.DRAFT,
      createdBy: new Types.ObjectId(userId),
      version: 1,
    });

    // 5. Emit initial audit log
    await this.auditLogsService.create({
      postId: post._id.toString(),
      actor: userId,
      fromStatus: 'NONE',
      toStatus: PostStatus.DRAFT,
      ipAddress: clientContext?.ipAddress,
      userAgent: clientContext?.userAgent,
      metadata: { version: 1, platform: post.platform },
    });

    return this.findOne(post._id.toString());
  }

  async findAll(
    user: AuthenticatedUser,
    filters?: { client?: string; platform?: string; status?: string },
  ) {
    let createdBy: string | undefined;
    let clientIds: string[] | undefined;

    if (user.role === Role.CREATOR) {
      createdBy = user.userId;
    } else if (user.role === Role.REVIEWER) {
      clientIds = await this.clientsService.findClientIdsForReviewer(user.userId);
    }

    return this.postsRepository.findWithFilters({
      createdBy,
      clientIds,
      clientId: filters?.client,
      platform: filters?.platform,
      status: filters?.status,
    });
  }

  async findOne(id: string, user?: AuthenticatedUser) {
    const post = await this.postsRepository.findByIdPopulated(id);
    if (!post) {
      throw new NotFoundAppError(
        ErrorCode.POST_NOT_FOUND,
        `Post with ID "${id}" not found`,
      );
    }

    if (user) {
      if (user.role === Role.CREATOR && post.createdBy._id.toString() !== user.userId) {
        throw new ForbiddenAppError(
          ErrorCode.CREATOR_EDIT_FORBIDDEN,
          'You do not have access to view this post',
        );
      }

      if (user.role === Role.REVIEWER) {
        const client = post.client as any;
        const isAssigned = client.reviewers?.some(
          (r: any) => (r._id ? r._id.toString() : r.toString()) === user.userId,
        );
        if (!isAssigned) {
          throw new ForbiddenAppError(
            ErrorCode.REVIEWER_NOT_ASSIGNED_TO_CLIENT,
            'You are not assigned as a reviewer for this client',
          );
        }
      }
    }

    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto, user: AuthenticatedUser) {
    const post = await this.postsRepository.findById(id);
    if (!post) {
      throw new NotFoundAppError(
        ErrorCode.POST_NOT_FOUND,
        `Post with ID "${id}" not found`,
      );
    }

    if (post.createdBy.toString() !== user.userId) {
      throw new ForbiddenAppError(
        ErrorCode.CREATOR_EDIT_FORBIDDEN,
        'Only the creator who created this post can edit it.',
      );
    }

    if (
      post.status !== PostStatus.DRAFT &&
      post.status !== PostStatus.CHANGES_REQUESTED
    ) {
      throw new ValidationAppError(
        ErrorCode.POST_STATUS_NOT_EDITABLE,
        `Posts can only be edited in DRAFT or CHANGES_REQUESTED status. Current status is ${post.status}.`,
      );
    }

    if (post.version !== updatePostDto.version) {
      throw new ConflictAppError(
        ErrorCode.OPTIMISTIC_LOCK_CONFLICT,
        `Optimistic lock conflict: Expected version ${updatePostDto.version}, but current version is ${post.version}. Please refresh to get latest data.`,
        { expectedVersion: updatePostDto.version, currentVersion: post.version },
      );
    }

    const targetPlatform = updatePostDto.platform || post.platform;
    const targetCaption =
      updatePostDto.caption !== undefined ? updatePostDto.caption.trim() : post.caption;

    this.validateCaptionLength(targetPlatform, targetCaption);

    if (updatePostDto.platform) {
      post.platform = updatePostDto.platform;
    }

    if (updatePostDto.caption !== undefined) {
      post.caption = targetCaption;
    }

    if (updatePostDto.scheduledAt !== undefined) {
      post.scheduledAt = this.validateFutureDate(updatePostDto.scheduledAt);
    }

    post.version += 1;
    await this.postsRepository.save(post);

    return this.findOne(id);
  }

  async transitionStatus(
    id: string,
    transitionDto: TransitionPostDto,
    user: AuthenticatedUser,
    clientContext?: RequestClientContext,
  ) {
    const post = await this.postsRepository.findById(id);
    if (!post) {
      throw new NotFoundAppError(
        ErrorCode.POST_NOT_FOUND,
        `Post with ID "${id}" not found`,
      );
    }

    // Populate client for reviewer check and conflict check
    const populatedPost = await this.postsRepository.findByIdPopulated(id);
    if (!populatedPost) {
      throw new NotFoundAppError(
        ErrorCode.POST_NOT_FOUND,
        `Post with ID "${id}" not found`,
      );
    }

    const fromStatus = post.status;
    const toStatus = transitionDto.toStatus;

    // 1. Enforce workflow transition graph
    const allowedTargets = VALID_TRANSITIONS[fromStatus] || [];
    if (!allowedTargets.includes(toStatus)) {
      throw new ValidationAppError(
        ErrorCode.INVALID_STATUS_TRANSITION,
        `Invalid status transition from "${fromStatus}" to "${toStatus}". Allowed transitions from "${fromStatus}": [${allowedTargets.join(', ')}].`,
        { fromStatus, toStatus, allowedTransitions: allowedTargets },
      );
    }

    // 2. Enforce optimistic locking
    if (post.version !== transitionDto.version) {
      throw new ConflictAppError(
        ErrorCode.OPTIMISTIC_LOCK_CONFLICT,
        `Optimistic lock conflict: Post was modified by another operation. Expected version ${transitionDto.version}, current version is ${post.version}. Please refresh.`,
        { expectedVersion: transitionDto.version, currentVersion: post.version },
      );
    }

    // 3. Reviewer client assignment check
    if (user.role === Role.REVIEWER) {
      const client = populatedPost.client as any;
      const isAssigned = client.reviewers?.some(
        (r: any) => (r._id ? r._id.toString() : r.toString()) === user.userId,
      );
      if (!isAssigned) {
        throw new ForbiddenAppError(
          ErrorCode.REVIEWER_NOT_ASSIGNED_TO_CLIENT,
          'A reviewer can only see and act on posts for clients assigned to them.',
        );
      }
    }

    // 4. Creator permission for DRAFT -> IN_REVIEW and CHANGES_REQUESTED -> IN_REVIEW
    if (
      (fromStatus === PostStatus.DRAFT || fromStatus === PostStatus.CHANGES_REQUESTED) &&
      toStatus === PostStatus.IN_REVIEW
    ) {
      if (user.role === Role.CREATOR && post.createdBy.toString() !== user.userId) {
        throw new ForbiddenAppError(
          ErrorCode.CREATOR_EDIT_FORBIDDEN,
          'Only the post creator can submit it for review.',
        );
      }
    }

    // 5. Rule: A user can never approve their own post
    if (toStatus === PostStatus.APPROVED) {
      if (post.createdBy.toString() === user.userId) {
        throw new ValidationAppError(
          ErrorCode.SELF_APPROVAL_FORBIDDEN,
          'A user can never approve their own post.',
        );
      }
    }

    // 6. Rule: Requesting changes requires a comment of at least 10 characters
    if (toStatus === PostStatus.CHANGES_REQUESTED) {
      if (!transitionDto.comment || transitionDto.comment.trim().length < 10) {
        throw new ValidationAppError(
          ErrorCode.CHANGES_REQUEST_COMMENT_REQUIRED,
          'Requesting changes requires a comment of at least 10 characters explaining the necessary revisions.',
        );
      }
    }

    // 7. Scheduling rule: APPROVED -> SCHEDULED
    if (toStatus === PostStatus.SCHEDULED) {
      let scheduleDate = post.scheduledAt;

      if (transitionDto.scheduledAt) {
        scheduleDate = this.validateFutureDate(transitionDto.scheduledAt);
      }

      if (!scheduleDate) {
        throw new ValidationAppError(
          ErrorCode.SCHEDULED_TIME_REQUIRED,
          'A post cannot be transitioned to SCHEDULED without a valid scheduledAt date.',
        );
      }

      if (new Date(scheduleDate) <= new Date()) {
        throw new ValidationAppError(
          ErrorCode.SCHEDULED_TIME_NOT_FUTURE,
          'The scheduled time must be in the future.',
        );
      }

      // Check 2-hour scheduling conflict rule
      const clientId = (populatedPost.client as any)._id
        ? (populatedPost.client as any)._id.toString()
        : populatedPost.client.toString();

      const conflictingPost = await this.checkSchedulingConflict(
        post._id.toString(),
        clientId,
        post.platform,
        new Date(scheduleDate),
      );

      if (conflictingPost) {
        throw new ConflictAppError(
          ErrorCode.SCHEDULING_CONFLICT_2HR,
          `Scheduling conflict: two posts for the same client on the same platform must be at least 2 hours apart. Conflicting post ID: ${conflictingPost._id}.`,
          { conflictingPostId: conflictingPost._id.toString() },
        );
      }

      post.scheduledAt = scheduleDate;
    }

    // Save feedback comment if provided
    if (transitionDto.comment && transitionDto.comment.trim()) {
      await this.commentsService.create({
        postId: id,
        authorId: user.userId,
        message: transitionDto.comment.trim(),
      });
    }

    // Apply status change and increment version
    post.status = toStatus;
    post.version += 1;
    await this.postsRepository.save(post);

    // Record immutable AuditLog entry with client context (IP, User-Agent)
    await this.auditLogsService.create({
      postId: id,
      actor: user.userId,
      fromStatus,
      toStatus,
      ipAddress: clientContext?.ipAddress,
      userAgent: clientContext?.userAgent,
      metadata: {
        version: post.version,
        commentProvided: Boolean(transitionDto.comment),
      },
    });

    return this.findOne(id);
  }

  // Method called by background cron scheduler
  async publishDuePosts(): Promise<number> {
    const now = new Date();
    const duePosts = await this.postsRepository.findDueScheduledPosts(now);

    let publishedCount = 0;
    for (const post of duePosts) {
      const fromStatus = post.status;
      post.status = PostStatus.PUBLISHED;
      post.version += 1;
      await this.postsRepository.save(post);

      await this.auditLogsService.create({
        postId: post._id.toString(),
        actor: 'SYSTEM',
        fromStatus,
        toStatus: PostStatus.PUBLISHED,
        userAgent: 'NestJS-Scheduler/Cron-Automated',
        metadata: { scheduledAt: post.scheduledAt, publishedAt: now },
      });

      publishedCount++;
    }

    return publishedCount;
  }
}
