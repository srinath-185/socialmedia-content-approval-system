import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async create(data: { postId: string; authorId: string; message: string }) {
    if (!Types.ObjectId.isValid(data.postId)) {
      throw new BadRequestException(`Invalid post ID: "${data.postId}"`);
    }

    const comment = new this.commentModel({
      post: new Types.ObjectId(data.postId),
      author: new Types.ObjectId(data.authorId),
      message: data.message.trim(),
    });

    const saved = await comment.save();
    return this.commentModel
      .findById(saved._id)
      .populate('author', 'name email role')
      .exec();
  }

  async findByPost(postId: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException(`Invalid post ID: "${postId}"`);
    }

    return this.commentModel
      .find({ post: new Types.ObjectId(postId) })
      .populate('author', 'name email role')
      .sort({ createdAt: 1 })
      .exec();
  }
}
