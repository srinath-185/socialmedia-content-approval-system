import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from '../schemas/comment.schema';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
  ) {}

  async create(data: {
    post: Types.ObjectId;
    author: Types.ObjectId;
    message: string;
  }): Promise<CommentDocument> {
    const comment = new this.commentModel(data);
    const saved = await comment.save();
    return this.commentModel
      .findById(saved._id)
      .populate('author', 'name email role')
      .exec() as Promise<CommentDocument>;
  }

  async findByPost(postId: string): Promise<CommentDocument[]> {
    if (!Types.ObjectId.isValid(postId)) return [];
    return this.commentModel
      .find({ post: new Types.ObjectId(postId) })
      .populate('author', 'name email role')
      .sort({ createdAt: 1 })
      .exec();
  }
}
