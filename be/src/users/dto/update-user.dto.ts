import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Karthik Subramaniam' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'srinath.updated@concepsmedia.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({ example: 'NewSecret@123' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @ApiPropertyOptional({ enum: Role, example: Role.REVIEWER })
  @IsOptional()
  @IsEnum(Role, { message: 'Role must be ADMIN, CREATOR, or REVIEWER' })
  role?: Role;
}
