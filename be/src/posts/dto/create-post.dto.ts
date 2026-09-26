import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsISO8601,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Platform } from '../../common/enums/platform.enum';

export class CreatePostDto {
  @ApiProperty({ example: '66fa49f3e1b9a91234567890', description: 'Client MongoDB ObjectId' })
  @IsMongoId({ message: 'client must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'client is required' })
  client: string;

  @ApiProperty({ enum: Platform, example: Platform.INSTAGRAM, description: 'Target social media platform' })
  @IsEnum(Platform, { message: 'platform must be INSTAGRAM, FACEBOOK, LINKEDIN, or X' })
  @IsNotEmpty({ message: 'platform is required' })
  platform: Platform;

  @ApiProperty({
    example: 'Launching our latest creative campaign! Stay tuned. #Media #Design',
    description: 'Post caption text (validated against platform-specific character limits)',
  })
  @IsString({ message: 'caption must be a string' })
  @IsNotEmpty({ message: 'caption cannot be empty' })
  caption: string;

  @ApiPropertyOptional({
    example: '2026-10-15T14:30:00.000Z',
    description: 'ISO-8601 scheduled publication time in UTC (must be in the future)',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'scheduledAt must be a valid ISO-8601 UTC date string' })
  scheduledAt?: string;
}
