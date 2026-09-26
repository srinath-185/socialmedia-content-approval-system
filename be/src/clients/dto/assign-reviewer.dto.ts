import { IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignReviewerDto {
  @ApiProperty({ example: '66fa49f3e1b9a91234567890', description: 'User ID of the reviewer' })
  @IsMongoId({ message: 'reviewerId must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'reviewerId is required' })
  reviewerId: string;
}
