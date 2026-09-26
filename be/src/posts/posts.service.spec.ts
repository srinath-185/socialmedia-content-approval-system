import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { PostsService } from './posts.service';
import { PostsRepository } from './repositories/posts.repository';
import { ClientsService } from '../clients/clients.service';
import { CommentsService } from '../comments/comments.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PostStatus } from '../common/enums/post-status.enum';
import { Platform } from '../common/enums/platform.enum';
import { Role } from '../common/enums/role.enum';
import {
  ConflictAppError,
  ForbiddenAppError,
  ValidationAppError,
} from '../common/errors/app-error';

describe('PostsService - Unit Tests', () => {
  let service: PostsService;
  let mockPostsRepository: any;
  let mockClientsService: any;
  let mockCommentsService: any;
  let mockAuditLogsService: any;

  const mockClientId = new Types.ObjectId().toString();
  const creatorId = new Types.ObjectId().toString();
  const reviewerId = new Types.ObjectId().toString();
  const adminId = new Types.ObjectId().toString();

  const mockClient = {
    _id: new Types.ObjectId(mockClientId),
    brandName: 'Acme Media',
    reviewers: [new Types.ObjectId(reviewerId)],
  };

  const createMockPost = (overrides = {}) => ({
    _id: new Types.ObjectId(),
    client: mockClient,
    platform: Platform.INSTAGRAM,
    caption: 'Default valid caption for Instagram test post.',
    scheduledAt: null,
    status: PostStatus.DRAFT,
    createdBy: new Types.ObjectId(creatorId),
    version: 1,
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  });

  beforeEach(async () => {
    mockPostsRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdPopulated: jest.fn(),
      findWithFilters: jest.fn(),
      findConflictingPost: jest.fn(),
      findDueScheduledPosts: jest.fn(),
      save: jest.fn().mockImplementation(async (post) => {
        if (post.save) await post.save();
        return post;
      }),
    };

    mockClientsService = {
      findOne: jest.fn().mockResolvedValue(mockClient),
      findClientIdsForReviewer: jest.fn().mockResolvedValue([mockClientId]),
    };

    mockCommentsService = {
      create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
    };

    mockAuditLogsService = {
      create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PostsRepository,
          useValue: mockPostsRepository,
        },
        {
          provide: ClientsService,
          useValue: mockClientsService,
        },
        {
          provide: CommentsService,
          useValue: mockCommentsService,
        },
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  describe('1. Post Status Workflow Transitions', () => {
    it('should successfully transition DRAFT -> IN_REVIEW by creator', async () => {
      const post = createMockPost({ status: PostStatus.DRAFT, version: 1 });
      mockPostsRepository.findById.mockResolvedValue(post);
      mockPostsRepository.findByIdPopulated.mockResolvedValue(post);

      await service.transitionStatus(
        post._id.toString(),
        { toStatus: PostStatus.IN_REVIEW, version: 1 },
        { userId: creatorId, email: 'creator@test.com', role: Role.CREATOR, name: 'Creator' },
      );

      expect(post.status).toBe(PostStatus.IN_REVIEW);
      expect(post.version).toBe(2);
      expect(mockPostsRepository.save).toHaveBeenCalled();
      expect(mockAuditLogsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: post._id.toString(),
          actor: creatorId,
          fromStatus: PostStatus.DRAFT,
          toStatus: PostStatus.IN_REVIEW,
        }),
      );
    });

    it('should reject invalid transition DRAFT -> APPROVED with ValidationAppError (400)', async () => {
      const post = createMockPost({ status: PostStatus.DRAFT, version: 1 });
      mockPostsRepository.findById.mockResolvedValue(post);
      mockPostsRepository.findByIdPopulated.mockResolvedValue(post);

      await expect(
        service.transitionStatus(
          post._id.toString(),
          { toStatus: PostStatus.APPROVED, version: 1 },
          { userId: reviewerId, email: 'rev@test.com', role: Role.REVIEWER, name: 'Reviewer' },
        ),
      ).rejects.toThrow(ValidationAppError);
    });

    it('should reject invalid transition PUBLISHED -> DRAFT with ValidationAppError (400)', async () => {
      const post = createMockPost({ status: PostStatus.PUBLISHED, version: 1 });
      mockPostsRepository.findById.mockResolvedValue(post);
      mockPostsRepository.findByIdPopulated.mockResolvedValue(post);

      await expect(
        service.transitionStatus(
          post._id.toString(),
          { toStatus: PostStatus.DRAFT, version: 1 },
          { userId: creatorId, email: 'c@test.com', role: Role.CREATOR, name: 'Creator' },
        ),
      ).rejects.toThrow(ValidationAppError);
    });

    it('should reject self-approval: user cannot approve their own post (400 ValidationAppError)', async () => {
      const post = createMockPost({
        status: PostStatus.IN_REVIEW,
        createdBy: new Types.ObjectId(creatorId),
        version: 1,
      });
      mockPostsRepository.findById.mockResolvedValue(post);
      mockPostsRepository.findByIdPopulated.mockResolvedValue(post);

      await expect(
        service.transitionStatus(
          post._id.toString(),
          { toStatus: PostStatus.APPROVED, version: 1 },
          { userId: creatorId, email: 'creator@test.com', role: Role.ADMIN, name: 'Creator/Admin' },
        ),
      ).rejects.toThrow(ValidationAppError);
    });

    it('should reject reviewer acting on a post for a client not assigned to them (403 ForbiddenAppError)', async () => {
      const unassignedReviewerId = new Types.ObjectId().toString();
      const post = createMockPost({
        status: PostStatus.IN_REVIEW,
        client: {
          _id: new Types.ObjectId(mockClientId),
          brandName: 'Brand',
          reviewers: [new Types.ObjectId(reviewerId)], // unassignedReviewerId not in list
        },
        version: 1,
      });
      mockPostsRepository.findById.mockResolvedValue(post);
      mockPostsRepository.findByIdPopulated.mockResolvedValue(post);

      await expect(
        service.transitionStatus(
          post._id.toString(),
          { toStatus: PostStatus.APPROVED, version: 1 },
          {
            userId: unassignedReviewerId,
            email: 'other@test.com',
            role: Role.REVIEWER,
            name: 'Other Reviewer',
          },
        ),
      ).rejects.toThrow(ForbiddenAppError);
    });

    it('should reject CHANGES_REQUESTED without comment or with comment < 10 characters (400)', async () => {
      const post = createMockPost({ status: PostStatus.IN_REVIEW, version: 1 });
      mockPostsRepository.findById.mockResolvedValue(post);
      mockPostsRepository.findByIdPopulated.mockResolvedValue(post);

      // Too short comment (< 10 chars)
      await expect(
        service.transitionStatus(
          post._id.toString(),
          { toStatus: PostStatus.CHANGES_REQUESTED, version: 1, comment: 'Short' },
          { userId: reviewerId, email: 'rev@test.com', role: Role.REVIEWER, name: 'Reviewer' },
        ),
      ).rejects.toThrow(ValidationAppError);

      // Missing comment
      await expect(
        service.transitionStatus(
          post._id.toString(),
          { toStatus: PostStatus.CHANGES_REQUESTED, version: 1 },
          { userId: reviewerId, email: 'rev@test.com', role: Role.REVIEWER, name: 'Reviewer' },
        ),
      ).rejects.toThrow(ValidationAppError);
    });

    it('should accept CHANGES_REQUESTED when comment is >= 10 characters and create comment record', async () => {
      const post = createMockPost({ status: PostStatus.IN_REVIEW, version: 1 });
      mockPostsRepository.findById.mockResolvedValue(post);
      mockPostsRepository.findByIdPopulated.mockResolvedValue(post);

      const validFeedback = 'Please update the hashtag list and brand voice.';
      await service.transitionStatus(
        post._id.toString(),
        { toStatus: PostStatus.CHANGES_REQUESTED, version: 1, comment: validFeedback },
        { userId: reviewerId, email: 'rev@test.com', role: Role.REVIEWER, name: 'Reviewer' },
      );

      expect(post.status).toBe(PostStatus.CHANGES_REQUESTED);
      expect(mockCommentsService.create).toHaveBeenCalledWith({
        postId: post._id.toString(),
        authorId: reviewerId,
        message: validFeedback,
      });
    });

    it('should reject transition when version does not match due to optimistic locking (409 ConflictAppError)', async () => {
      const post = createMockPost({ status: PostStatus.IN_REVIEW, version: 3 });
      mockPostsRepository.findById.mockResolvedValue(post);
      mockPostsRepository.findByIdPopulated.mockResolvedValue(post);

      // Client submits stale version 2
      await expect(
        service.transitionStatus(
          post._id.toString(),
          { toStatus: PostStatus.APPROVED, version: 2 },
          { userId: reviewerId, email: 'rev@test.com', role: Role.REVIEWER, name: 'Reviewer' },
        ),
      ).rejects.toThrow(ConflictAppError);
    });
  });

  describe('2. Scheduling Conflict & Time Validation Rules', () => {
    it('should reject scheduling if scheduled time is in the past (400 ValidationAppError)', async () => {
      const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
      const post = createMockPost({ status: PostStatus.APPROVED, version: 1 });
      mockPostsRepository.findById.mockResolvedValue(post);
      mockPostsRepository.findByIdPopulated.mockResolvedValue(post);

      await expect(
        service.transitionStatus(
          post._id.toString(),
          { toStatus: PostStatus.SCHEDULED, version: 1, scheduledAt: pastDate },
          { userId: adminId, email: 'admin@test.com', role: Role.ADMIN, name: 'Admin' },
        ),
      ).rejects.toThrow(ValidationAppError);
    });

    it('should reject transition to SCHEDULED without any scheduledAt date (400 ValidationAppError)', async () => {
      const post = createMockPost({ status: PostStatus.APPROVED, scheduledAt: null, version: 1 });
      mockPostsRepository.findById.mockResolvedValue(post);
      mockPostsRepository.findByIdPopulated.mockResolvedValue(post);

      await expect(
        service.transitionStatus(
          post._id.toString(),
          { toStatus: PostStatus.SCHEDULED, version: 1 },
          { userId: adminId, email: 'admin@test.com', role: Role.ADMIN, name: 'Admin' },
        ),
      ).rejects.toThrow(ValidationAppError);
    });

    it('should return 409 Conflict with conflicting post ID when posts are within 2 hours for same client and platform', async () => {
      const targetTime = new Date(Date.now() + 24 * 3600 * 1000);
      const conflictingPostId = new Types.ObjectId();

      const post = createMockPost({
        status: PostStatus.APPROVED,
        platform: Platform.X,
        version: 1,
      });

      mockPostsRepository.findById.mockResolvedValue(post);
      mockPostsRepository.findByIdPopulated.mockResolvedValue(post);

      // Existing post scheduled within 2h conflict window
      const existingConflictingPost = {
        _id: conflictingPostId,
        platform: Platform.X,
        status: PostStatus.SCHEDULED,
        scheduledAt: new Date(targetTime.getTime() + 3600 * 1000),
      };

      mockPostsRepository.findConflictingPost.mockResolvedValue(existingConflictingPost);

      try {
        await service.transitionStatus(
          post._id.toString(),
          { toStatus: PostStatus.SCHEDULED, version: 1, scheduledAt: targetTime.toISOString() },
          { userId: adminId, email: 'admin@test.com', role: Role.ADMIN, name: 'Admin' },
        );
        fail('Expected ConflictAppError was not thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ConflictAppError);
        const response = err.getResponse();
        expect(response.details.conflictingPostId).toBe(conflictingPostId.toString());
      }
    });

    it('should allow scheduling when another post for same client and platform is >= 2 hours apart', async () => {
      const targetTime = new Date(Date.now() + 48 * 3600 * 1000);
      const post = createMockPost({
        status: PostStatus.APPROVED,
        platform: Platform.LINKEDIN,
        version: 1,
      });

      mockPostsRepository.findById.mockResolvedValue(post);
      mockPostsRepository.findByIdPopulated.mockResolvedValue(post);
      mockPostsRepository.findConflictingPost.mockResolvedValue(null);

      await service.transitionStatus(
        post._id.toString(),
        { toStatus: PostStatus.SCHEDULED, version: 1, scheduledAt: targetTime.toISOString() },
        { userId: adminId, email: 'admin@test.com', role: Role.ADMIN, name: 'Admin' },
      );

      expect(post.status).toBe(PostStatus.SCHEDULED);
      expect(post.version).toBe(2);
      expect(mockPostsRepository.save).toHaveBeenCalled();
    });
  });

  describe('3. Platform Caption Limits Validation', () => {
    it('should reject caption exceeding X character limit of 280 (400 ValidationAppError)', () => {
      const longCaption = 'A'.repeat(281);
      expect(() => {
        service.validateCaptionLength(Platform.X, longCaption);
      }).toThrow(ValidationAppError);
    });

    it('should accept caption within X character limit of 280', () => {
      const validCaption = 'A'.repeat(280);
      expect(() => {
        service.validateCaptionLength(Platform.X, validCaption);
      }).not.toThrow();
    });

    it('should reject caption exceeding Instagram character limit of 2200 (400 ValidationAppError)', () => {
      const longCaption = 'A'.repeat(2201);
      expect(() => {
        service.validateCaptionLength(Platform.INSTAGRAM, longCaption);
      }).toThrow(ValidationAppError);
    });

    it('should reject caption exceeding LinkedIn character limit of 3000 (400 ValidationAppError)', () => {
      const longCaption = 'A'.repeat(3001);
      expect(() => {
        service.validateCaptionLength(Platform.LINKEDIN, longCaption);
      }).toThrow(ValidationAppError);
    });

    it('should reject caption exceeding Facebook character limit of 5000 (400 ValidationAppError)', () => {
      const longCaption = 'A'.repeat(5001);
      expect(() => {
        service.validateCaptionLength(Platform.FACEBOOK, longCaption);
      }).toThrow(ValidationAppError);
    });
  });

  describe('4. Creator Post Edit Restrictions', () => {
    it('should forbid non-creators from editing a post (403 ForbiddenAppError)', async () => {
      const post = createMockPost({ createdBy: new Types.ObjectId(creatorId) });
      mockPostsRepository.findById.mockResolvedValue(post);

      const differentUserId = new Types.ObjectId().toString();
      await expect(
        service.update(
          post._id.toString(),
          { caption: 'Updated', version: 1 },
          { userId: differentUserId, email: 'other@test.com', role: Role.CREATOR, name: 'Other' },
        ),
      ).rejects.toThrow(ForbiddenAppError);
    });

    it('should reject edits if post is in APPROVED or SCHEDULED status (400 ValidationAppError)', async () => {
      const post = createMockPost({
        createdBy: new Types.ObjectId(creatorId),
        status: PostStatus.APPROVED,
      });
      mockPostsRepository.findById.mockResolvedValue(post);

      await expect(
        service.update(
          post._id.toString(),
          { caption: 'Updated', version: 1 },
          { userId: creatorId, email: 'creator@test.com', role: Role.CREATOR, name: 'Creator' },
        ),
      ).rejects.toThrow(ValidationAppError);
    });

    it('should allow creator to edit post when in DRAFT or CHANGES_REQUESTED', async () => {
      const post = createMockPost({
        createdBy: new Types.ObjectId(creatorId),
        status: PostStatus.CHANGES_REQUESTED,
        version: 1,
      });
      mockPostsRepository.findById.mockResolvedValue(post);
      mockPostsRepository.findByIdPopulated.mockResolvedValue(post);

      await service.update(
        post._id.toString(),
        { caption: 'Valid revision caption', version: 1 },
        { userId: creatorId, email: 'creator@test.com', role: Role.CREATOR, name: 'Creator' },
      );

      expect(post.caption).toBe('Valid revision caption');
      expect(post.version).toBe(2);
      expect(mockPostsRepository.save).toHaveBeenCalled();
    });
  });
});
