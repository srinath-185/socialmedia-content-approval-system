import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { CommentsRepository } from './repositories/comments.repository';
import { ValidationAppError } from '../common/errors/app-error';
import { ErrorCode } from '../common/errors/error-codes.enum';

@Injectable()
export class CommentsService {
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async create(data: { postId: string; authorId: string; message: string }) {
    if (!Types.ObjectId.isValid(data.postId)) {
      throw new ValidationAppError(
        ErrorCode.POST_NOT_FOUND,
        `Invalid post ID: "${data.postId}"`,
      );
    }

    return this.commentsRepository.create({
      post: new Types.ObjectId(data.postId),
      author: new Types.ObjectId(data.authorId),
      message: data.message.trim(),
    });
  }

  async findByPost(postId: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new ValidationAppError(
        ErrorCode.POST_NOT_FOUND,
        `Invalid post ID: "${postId}"`,
      );
    }

    return this.commentsRepository.findByPost(postId);
  }
}
