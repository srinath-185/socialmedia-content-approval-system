import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Please adjust the hashtags and add brand campaign mentions.',
    description: 'Comment message',
  })
  @IsString({ message: 'message must be a string' })
  @IsNotEmpty({ message: 'Comment message cannot be empty' })
  message: string;
}
