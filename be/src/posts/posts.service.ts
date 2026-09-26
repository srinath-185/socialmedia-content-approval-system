import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { TransitionPostDto } from './dto/transition-post.dto';
import { ClientsService } from '../clients/clients.service';
import { CommentsService } from '../comments/comments.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PostStatus, VALID_TRANSITIONS } from '../common/enums/post-status.enum';
import { Platform } from '../common/enums/platform.enum';
import { Role } from '../common/enums/role.enum';
import { CAPTION_LIMITS } from '../common/constants/platform-limits';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private clientsService: ClientsService,
    private commentsService: CommentsService,
    private auditLogsService: AuditLogsService,
  ) {}

  validateCaptionLength(platform: Platform, caption: string): void {
    const limit = CAPTION_LIMITS[platform];
    if (limit && caption.length > limit) {
      throw new BadRequestException(
        `Caption exceeds the maximum character limit for ${platform}. Allowed: ${limit}, provided: ${caption.length}.`,
      );
    }
  }

  validateFutureDate(scheduledAt?: string | Date | null): Date | null {
    if (!scheduledAt) return null;
    const date = new Date(scheduledAt);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid scheduledAt date format.');
    }
    if (date <= new Date()) {
      throw new BadRequestException('The scheduled time must be in the future.');
    }
    return date;
  }

  async checkSchedulingConflict(
    postId: string | null,
    clientId: string,
    platform: Platform,
    scheduledAt: Date,
  ): Promise<PostDocument | null> {
    const twoHoursMs = 2 * 60 * 60 * 1000;
    const targetTime = scheduledAt.getTime();
    const windowStart = new Date(targetTime - twoHoursMs);
    const windowEnd = new Date(targetTime + twoHoursMs);

    const query: any = {
      client: new Types.ObjectId(clientId),
      platform,
      status: { $in: [PostStatus.SCHEDULED, PostStatus.PUBLISHED] },
      scheduledAt: { $gte: windowStart, $lte: windowEnd },
    };

    if (postId && Types.ObjectId.isValid(postId)) {
      query._id = { $ne: new Types.ObjectId(postId) };
    }

    return this.postModel.findOne(query).exec();
  }

  async create(createPostDto: CreatePostDto, userId: string) {
    // 1. Verify client exists
    await this.clientsService.findOne(createPostDto.client);

    // 2. Validate caption limits
    this.validateCaptionLength(createPostDto.platform, createPostDto.caption);

    // 3. Validate scheduled date is in the future if provided
    const scheduledDate = this.validateFutureDate(createPostDto.scheduledAt);

    // 4. Save new post in DRAFT status with version 1
    const post = new this.postModel({
      client: new Types.ObjectId(createPostDto.client),
      platform: createPostDto.platform,
      caption: createPostDto.caption.trim(),
      scheduledAt: scheduledDate,
      status: PostStatus.DRAFT,
      createdBy: new Types.ObjectId(userId),
      version: 1,
    });

    const saved = await post.save();

    // Log creation audit entry
    await this.auditLogsService.create({
      postId: saved._id.toString(),
      actor: userId,
      fromStatus: 'NONE',
      toStatus: PostStatus.DRAFT,
    });

    return this.findOne(saved._id.toString());
  }

  async findAll(
    user: AuthenticatedUser,
    filters?: { client?: string; platform?: string; status?: string },
  ) {
    const query: any = {};

    // Role-based visibility enforcement
    if (user.role === Role.CREATOR) {
      query.createdBy = new Types.ObjectId(user.userId);
    } else if (user.role === Role.REVIEWER) {
      const allowedClientIds = await this.clientsService.findClientIdsForReviewer(user.userId);
      query.client = { $in: allowedClientIds.map((id) => new Types.ObjectId(id)) };
    }

    if (filters?.client) {
      if (!Types.ObjectId.isValid(filters.client)) {
        throw new BadRequestException(`Invalid client filter ID: "${filters.client}"`);
      }
      query.client = new Types.ObjectId(filters.client);
    }

    if (filters?.platform) {
      query.platform = filters.platform;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    return this.postModel
      .find(query)
      .populate('client', 'brandName')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, user?: AuthenticatedUser) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid post ID format: "${id}"`);
    }

    const post = await this.postModel
      .findById(id)
      .populate('client', 'brandName reviewers')
      .populate('createdBy', 'name email role')
      .exec();

    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    // Role-based access validation
    if (user) {
      if (user.role === Role.CREATOR && post.createdBy._id.toString() !== user.userId) {
        throw new ForbiddenException('You do not have access to view this post');
      }

      if (user.role === Role.REVIEWER) {
        const client = post.client as any;
        const isAssigned = client.reviewers?.some(
          (r: any) => (r._id ? r._id.toString() : r.toString()) === user.userId,
        );
        if (!isAssigned) {
          throw new ForbiddenException('You are not assigned as a reviewer for this client');
        }
      }
    }

    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto, user: AuthenticatedUser) {
    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    // Rule: Only the creator who made a post can edit it
    if (post.createdBy.toString() !== user.userId) {
      throw new ForbiddenException('Only the creator who created this post can edit it.');
    }

    // Rule: Can only edit while DRAFT or CHANGES_REQUESTED
    if (
      post.status !== PostStatus.DRAFT &&
      post.status !== PostStatus.CHANGES_REQUESTED
    ) {
      throw new BadRequestException(
        `Posts can only be edited in DRAFT or CHANGES_REQUESTED status. Current status is ${post.status}.`,
      );
    }

    // Rule: Optimistic locking version validation
    if (post.version !== updatePostDto.version) {
      throw new ConflictException(
        `Optimistic lock conflict: Expected version ${updatePostDto.version}, but current version is ${post.version}. Please refresh to get latest data.`,
      );
    }

    const targetPlatform = updatePostDto.platform || post.platform;
    const targetCaption =
      updatePostDto.caption !== undefined ? updatePostDto.caption.trim() : post.caption;

    // Validate caption limit for target platform
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
    await post.save();

    return this.findOne(id);
  }

  async transitionStatus(
    id: string,
    transitionDto: TransitionPostDto,
    user: AuthenticatedUser,
  ) {
    const post = await this.postModel.findById(id).populate('client').exec();
    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    const fromStatus = post.status;
    const toStatus = transitionDto.toStatus;

    // 1. Enforce workflow transition graph
    const allowedTargets = VALID_TRANSITIONS[fromStatus] || [];
    if (!allowedTargets.includes(toStatus)) {
      throw new BadRequestException(
        `Invalid status transition from "${fromStatus}" to "${toStatus}". Allowed transitions from "${fromStatus}": [${allowedTargets.join(', ')}].`,
      );
    }

    // 2. Enforce optimistic locking
    if (post.version !== transitionDto.version) {
      throw new ConflictException(
        `Optimistic lock conflict: Post was modified by another operation. Expected version ${transitionDto.version}, current version is ${post.version}. Please refresh.`,
      );
    }

    // 3. Reviewer client assignment check
    if (user.role === Role.REVIEWER) {
      const client = post.client as any;
      const isAssigned = client.reviewers?.some(
        (r: any) => (r._id ? r._id.toString() : r.toString()) === user.userId,
      );
      if (!isAssigned) {
        throw new ForbiddenException(
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
        throw new ForbiddenException('Only the post creator can submit it for review.');
      }
    }

    // 5. Rule: A user can never approve their own post
    if (toStatus === PostStatus.APPROVED) {
      if (post.createdBy.toString() === user.userId) {
        throw new BadRequestException('A user can never approve their own post.');
      }
    }

    // 6. Rule: Requesting changes requires a comment of at least 10 characters
    if (toStatus === PostStatus.CHANGES_REQUESTED) {
      if (!transitionDto.comment || transitionDto.comment.trim().length < 10) {
        throw new BadRequestException(
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
        throw new BadRequestException(
          'A post cannot be transitioned to SCHEDULED without a valid scheduledAt date.',
        );
      }

      if (new Date(scheduleDate) <= new Date()) {
        throw new BadRequestException('The scheduled time must be in the future.');
      }

      // Check 2-hour scheduling conflict rule
      const clientId = (post.client as any)._id
        ? (post.client as any)._id.toString()
        : post.client.toString();

      const conflictingPost = await this.checkSchedulingConflict(
        post._id.toString(),
        clientId,
        post.platform,
        new Date(scheduleDate),
      );

      if (conflictingPost) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          message: `Scheduling conflict: two posts for the same client on the same platform must be at least 2 hours apart. Conflicting post ID: ${conflictingPost._id}.`,
          conflictingPostId: conflictingPost._id.toString(),
        });
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
    await post.save();

    // Record immutable AuditLog entry
    await this.auditLogsService.create({
      postId: id,
      actor: user.userId,
      fromStatus,
      toStatus,
    });

    return this.findOne(id);
  }

  // Method called by background cron scheduler
  async publishDuePosts(): Promise<number> {
    const now = new Date();
    const duePosts = await this.postModel
      .find({
        status: PostStatus.SCHEDULED,
        scheduledAt: { $lte: now },
      })
      .exec();

    let publishedCount = 0;
    for (const post of duePosts) {
      const fromStatus = post.status;
      post.status = PostStatus.PUBLISHED;
      post.version += 1;
      await post.save();

      await this.auditLogsService.create({
        postId: post._id.toString(),
        actor: 'SYSTEM',
        fromStatus,
        toStatus: PostStatus.PUBLISHED,
      });

      publishedCount++;
    }

    return publishedCount;
  }
}
