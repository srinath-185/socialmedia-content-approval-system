import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClientDto {
  @ApiProperty({ example: 'Nike Global' })
  @IsString()
  @IsNotEmpty({ message: 'Brand name cannot be empty' })
  brandName: string;
}
