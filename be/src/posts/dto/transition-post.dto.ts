import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsISO8601,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus } from '../../common/enums/post-status.enum';

export class TransitionPostDto {
  @ApiProperty({
    enum: PostStatus,
    example: PostStatus.IN_REVIEW,
    description: 'Target workflow status for the post',
  })
  @IsEnum(PostStatus, { message: 'toStatus must be a valid PostStatus value' })
  @IsNotEmpty({ message: 'toStatus is required' })
  toStatus: PostStatus;

  @ApiProperty({
    example: 1,
    description: 'Current post version for optimistic locking verification',
  })
  @IsInt({ message: 'version must be an integer' })
  @Min(1, { message: 'version must be at least 1' })
  @IsNotEmpty({ message: 'version is required for optimistic locking' })
  version: number;

  @ApiPropertyOptional({
    example: 'Please rewrite the call to action and update hashtag list.',
    description: 'Feedback comment (required and minimum 10 characters when toStatus is CHANGES_REQUESTED)',
  })
  @IsOptional()
  @IsString({ message: 'comment must be a string' })
  comment?: string;

  @ApiPropertyOptional({
    example: '2026-10-15T15:00:00.000Z',
    description: 'Scheduled publication time in UTC (validated if transitioning to SCHEDULED)',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'scheduledAt must be a valid ISO-8601 UTC date string' })
  scheduledAt?: string;
}
