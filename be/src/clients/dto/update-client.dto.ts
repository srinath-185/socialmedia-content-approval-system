import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClientDto {
  @ApiProperty({ example: 'Pampaana Aqua Systems Pvt Ltd' })
  @IsString()
  @IsNotEmpty({ message: 'Brand name cannot be empty' })
  brandName: string;
}
