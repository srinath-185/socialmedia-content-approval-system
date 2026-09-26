import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { TransitionPostDto } from './dto/transition-post.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Social Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @Roles(Role.CREATOR)
  @ApiOperation({ summary: 'Create a social media post in DRAFT status (CREATOR only)' })
  @ApiResponse({ status: 201, description: 'Post created in DRAFT status' })
  @ApiResponse({ status: 400, description: 'Caption exceeds platform limit or client not found' })
  async create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const clientContext = {
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.postsService.create(createPostDto, user.userId, clientContext);
  }

  @Get()
  @ApiOperation({ summary: 'List all posts accessible to the authenticated role' })
  @ApiQuery({ name: 'client', required: false, description: 'Filter by client ID' })
  @ApiQuery({ name: 'platform', required: false, description: 'Filter by platform' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by post status' })
  @ApiResponse({ status: 200, description: 'Array of posts' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('client') client?: string,
    @Query('platform') platform?: string,
    @Query('status') status?: string,
  ) {
    return this.postsService.findAll(user, { client, platform, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post details by ID' })
  @ApiResponse({ status: 200, description: 'Post details' })
  @ApiResponse({ status: 403, description: 'Forbidden: not authorized to view this post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.postsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.CREATOR)
  @ApiOperation({
    summary:
      'Update post caption/platform/schedule (CREATOR only, only in DRAFT or CHANGES_REQUESTED)',
  })
  @ApiResponse({ status: 200, description: 'Post successfully updated' })
  @ApiResponse({ status: 400, description: 'Status not editable or caption exceeds limit' })
  @ApiResponse({ status: 403, description: 'Forbidden: user did not create this post' })
  @ApiResponse({ status: 409, description: 'Conflict: optimistic lock version mismatch' })
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.postsService.update(id, updatePostDto, user);
  }

  @Post(':id/transition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transition post status through the approval and scheduling workflow',
  })
  @ApiResponse({ status: 200, description: 'Status transition successful' })
  @ApiResponse({ status: 400, description: 'Invalid transition, self-approval, or missing comment' })
  @ApiResponse({ status: 403, description: 'Forbidden: reviewer not assigned or not creator' })
  @ApiResponse({ status: 409, description: 'Optimistic lock conflict or scheduling conflict (2hr)' })
  async transitionStatus(
    @Param('id') id: string,
    @Body() transitionDto: TransitionPostDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const clientContext = {
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
      userAgent: req.headers['user-agent'],
    };
    return this.postsService.transitionStatus(id, transitionDto, user, clientContext);
  }
}
