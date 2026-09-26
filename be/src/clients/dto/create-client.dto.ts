import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ example: 'Nike', description: 'Brand or organization name' })
  @IsString()
  @IsNotEmpty({ message: 'Brand name is required' })
  brandName: string;
}
