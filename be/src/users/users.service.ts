import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './repositories/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ConflictAppError,
  NotFoundAppError,
} from '../common/errors/app-error';
import { ErrorCode } from '../common/errors/error-codes.enum';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto) {
    const normalizedEmail = createUserDto.email.toLowerCase();
    const exists = await this.usersRepository.existsByEmail(normalizedEmail);
    if (exists) {
      throw new ConflictAppError(
        ErrorCode.USER_ALREADY_EXISTS,
        `User with email "${createUserDto.email}" already exists`,
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const saved = await this.usersRepository.create({
      name: createUserDto.name,
      email: normalizedEmail,
      password: hashedPassword,
      role: createUserDto.role,
    });

    const { password: _, ...userWithoutPassword } = saved.toObject();
    return userWithoutPassword;
  }

  async findAll() {
    return this.usersRepository.findAll();
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundAppError(
        ErrorCode.USER_NOT_FOUND,
        `User with ID "${id}" not found`,
      );
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findByIdWithPassword(id);
    if (!user) {
      throw new NotFoundAppError(
        ErrorCode.USER_NOT_FOUND,
        `User with ID "${id}" not found`,
      );
    }

    if (updateUserDto.email && updateUserDto.email.toLowerCase() !== user.email) {
      const emailExists = await this.usersRepository.existsByEmail(
        updateUserDto.email.toLowerCase(),
        id,
      );
      if (emailExists) {
        throw new ConflictAppError(
          ErrorCode.USER_ALREADY_EXISTS,
          `Email "${updateUserDto.email}" is already in use`,
        );
      }
      user.email = updateUserDto.email.toLowerCase();
    }

    if (updateUserDto.name) {
      user.name = updateUserDto.name;
    }

    if (updateUserDto.role) {
      user.role = updateUserDto.role;
    }

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    const saved = await user.save();
    const { password: _, ...userWithoutPassword } = saved.toObject();
    return userWithoutPassword;
  }

  async remove(id: string) {
    const result = await this.usersRepository.delete(id);
    if (!result) {
      throw new NotFoundAppError(
        ErrorCode.USER_NOT_FOUND,
        `User with ID "${id}" not found`,
      );
    }
    return { success: true, message: `User with ID "${id}" successfully deleted` };
  }
}
