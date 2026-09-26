import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '../schemas/post.schema';
import { Platform } from '../../common/enums/platform.enum';
import { PostStatus } from '../../common/enums/post-status.enum';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
  ) {}

  async create(data: {
    client: Types.ObjectId;
    platform: Platform;
    caption: string;
    scheduledAt: Date | null;
    status: PostStatus;
    createdBy: Types.ObjectId;
    version: number;
  }): Promise<PostDocument> {
    const post = new this.postModel(data);
    return post.save();
  }

  async findById(id: string): Promise<PostDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.postModel.findById(id).exec();
  }

  async findByIdPopulated(id: string): Promise<PostDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.postModel
      .findById(id)
      .populate('client', 'brandName reviewers')
      .populate('createdBy', 'name email role')
      .exec();
  }

  async findWithFilters(filters: {
    createdBy?: string;
    clientIds?: string[];
    clientId?: string;
    platform?: string;
    status?: string;
  }): Promise<PostDocument[]> {
    const query: any = {};

    if (filters.createdBy && Types.ObjectId.isValid(filters.createdBy)) {
      query.createdBy = new Types.ObjectId(filters.createdBy);
    }

    if (filters.clientIds && filters.clientIds.length > 0) {
      query.client = { $in: filters.clientIds.map((id) => new Types.ObjectId(id)) };
    }

    if (filters.clientId && Types.ObjectId.isValid(filters.clientId)) {
      query.client = new Types.ObjectId(filters.clientId);
    }

    if (filters.platform) {
      query.platform = filters.platform;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    return this.postModel
      .find(query)
      .populate('client', 'brandName')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * 2-hour scheduling conflict sliding window:
   * Finds any post for the same client and platform in SCHEDULED or PUBLISHED status
   * whose scheduledAt falls within [scheduledAt - 2h, scheduledAt + 2h].
   */
  async findConflictingPost(
    excludePostId: string | null,
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

    if (excludePostId && Types.ObjectId.isValid(excludePostId)) {
      query._id = { $ne: new Types.ObjectId(excludePostId) };
    }

    return this.postModel.findOne(query).exec();
  }

  /**
   * Finds all posts in SCHEDULED status whose scheduledAt has arrived or passed.
   */
  async findDueScheduledPosts(currentTime: Date): Promise<PostDocument[]> {
    return this.postModel
      .find({
        status: PostStatus.SCHEDULED,
        scheduledAt: { $lte: currentTime },
      })
      .exec();
  }

  async save(post: PostDocument): Promise<PostDocument> {
    return post.save();
  }
}
