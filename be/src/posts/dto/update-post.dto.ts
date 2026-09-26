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
import { Platform } from '../../common/enums/platform.enum';

export class UpdatePostDto {
  @ApiPropertyOptional({ enum: Platform, example: Platform.LINKEDIN })
  @IsOptional()
  @IsEnum(Platform, { message: 'platform must be INSTAGRAM, FACEBOOK, LINKEDIN, or X' })
  platform?: Platform;

  @ApiPropertyOptional({ example: 'Updated caption with exciting revisions! #NewLaunch' })
  @IsOptional()
  @IsString({ message: 'caption must be a string' })
  @IsNotEmpty({ message: 'caption cannot be empty' })
  caption?: string;

  @ApiPropertyOptional({ example: '2026-10-16T10:00:00.000Z' })
  @IsOptional()
  @IsISO8601({}, { message: 'scheduledAt must be a valid ISO-8601 UTC date string' })
  scheduledAt?: string;

  @ApiProperty({
    example: 1,
    description: 'Current version of the post for optimistic locking concurrency control',
  })
  @IsInt({ message: 'version must be an integer' })
  @Min(1, { message: 'version must be at least 1' })
  @IsNotEmpty({ message: 'version is required for optimistic locking' })
  version: number;
}
