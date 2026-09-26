import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'Karthik Subramaniam', description: 'Full name' })
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;

  @ApiProperty({ example: 'karthik@concepsmedia.com', description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email: string;

  @ApiProperty({ example: 'SecurePassword@123', description: 'User password (min 6 characters)' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ enum: Role, example: Role.CREATOR, description: 'Role assigned to the user' })
  @IsEnum(Role, { message: 'Role must be ADMIN, CREATOR, or REVIEWER' })
  role: Role;
}
