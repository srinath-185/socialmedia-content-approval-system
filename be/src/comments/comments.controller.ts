import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Comments & Review Feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a comment to the post thread' })
  @ApiResponse({ status: 201, description: 'Comment created' })
  async create(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commentsService.create({
      postId,
      authorId: user.userId,
      message: createCommentDto.message,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments for a post in chronological order' })
  @ApiResponse({ status: 200, description: 'Chronological comment thread' })
  async findByPost(@Param('postId') postId: string) {
    return this.commentsService.findByPost(postId);
  }
}
