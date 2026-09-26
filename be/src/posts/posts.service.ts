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
import { ClientsService } from '../clients/clients.service';
import { PostStatus } from '../common/enums/post-status.enum';
import { Platform } from '../common/enums/platform.enum';
import { Role } from '../common/enums/role.enum';
import { CAPTION_LIMITS } from '../common/constants/platform-limits';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private clientsService: ClientsService,
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

  async create(createPostDto: CreatePostDto, userId: string) {
    // 1. Verify client exists
    await this.clientsService.findOne(createPostDto.client);

    // 2. Validate caption limits
    this.validateCaptionLength(createPostDto.platform, createPostDto.caption);

    // 3. Validate scheduled date is future if provided
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

    // Business Rule 1: Only the creator who made a post can edit it
    if (post.createdBy.toString() !== user.userId) {
      throw new ForbiddenException('Only the creator who created this post can edit it.');
    }

    // Business Rule 2: Can only edit while DRAFT or CHANGES_REQUESTED
    if (
      post.status !== PostStatus.DRAFT &&
      post.status !== PostStatus.CHANGES_REQUESTED
    ) {
      throw new BadRequestException(
        `Posts can only be edited in DRAFT or CHANGES_REQUESTED status. Current status is ${post.status}.`,
      );
    }

    // Business Rule 3: Optimistic locking version validation
    if (post.version !== updatePostDto.version) {
      throw new ConflictException(
        `Optimistic lock error: The post was modified by another operation. Expected version ${updatePostDto.version}, but current database version is ${post.version}. Please refresh.`,
      );
    }

    const targetPlatform = updatePostDto.platform || post.platform;
    const targetCaption = updatePostDto.caption !== undefined ? updatePostDto.caption.trim() : post.caption;

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

    // Increment version on update
    post.version += 1;

    await post.save();
    return this.findOne(id);
  }
}
