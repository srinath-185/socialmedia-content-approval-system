import { Injectable } from '@nestjs/common';
import { ClientsRepository } from './repositories/clients.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Role } from '../common/enums/role.enum';
import {
  ConflictAppError,
  NotFoundAppError,
  ValidationAppError,
} from '../common/errors/app-error';
import { ErrorCode } from '../common/errors/error-codes.enum';

@Injectable()
export class ClientsService {
  constructor(
    private readonly clientsRepository: ClientsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(createClientDto: CreateClientDto) {
    const existing = await this.clientsRepository.findByBrandName(createClientDto.brandName);
    if (existing) {
      throw new ConflictAppError(
        ErrorCode.CLIENT_ALREADY_EXISTS,
        `Client brand "${createClientDto.brandName}" already exists`,
      );
    }

    return this.clientsRepository.create(createClientDto.brandName);
  }

  async findAll(user?: { userId: string; role: string }) {
    const reviewerId = user && user.role === Role.REVIEWER ? user.userId : undefined;
    return this.clientsRepository.findAll(reviewerId);
  }

  async findOne(id: string) {
    const client = await this.clientsRepository.findById(id);
    if (!client) {
      throw new NotFoundAppError(
        ErrorCode.CLIENT_NOT_FOUND,
        `Client with ID "${id}" not found`,
      );
    }
    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    const client = await this.findOne(id);

    const trimmedName = updateClientDto.brandName.trim();
    if (trimmedName.toLowerCase() !== client.brandName.toLowerCase()) {
      const duplicate = await this.clientsRepository.findByBrandName(trimmedName, id);
      if (duplicate) {
        throw new ConflictAppError(
          ErrorCode.CLIENT_ALREADY_EXISTS,
          `Client brand "${trimmedName}" already exists`,
        );
      }
      client.brandName = trimmedName;
    }

    return client.save();
  }

  async remove(id: string) {
    const client = await this.findOne(id);
    await this.clientsRepository.delete(id);
    return { success: true, message: `Client "${client.brandName}" successfully deleted` };
  }

  async assignReviewer(clientId: string, reviewerId: string) {
    const client = await this.findOne(clientId);

    const reviewer = await this.usersRepository.findById(reviewerId);
    if (!reviewer) {
      throw new NotFoundAppError(
        ErrorCode.USER_NOT_FOUND,
        `Reviewer with ID "${reviewerId}" not found`,
      );
    }

    if (reviewer.role !== Role.REVIEWER) {
      throw new ValidationAppError(
        ErrorCode.REVIEWER_ROLE_REQUIRED,
        `User "${reviewer.name}" has role ${reviewer.role}. Only users with role REVIEWER can be assigned to clients.`,
      );
    }

    const isAlreadyAssigned = client.reviewers.some(
      (r: any) => (r._id ? r._id.toString() : r.toString()) === reviewerId,
    );

    if (isAlreadyAssigned) {
      throw new ConflictAppError(
        ErrorCode.REVIEWER_ALREADY_ASSIGNED,
        `Reviewer "${reviewer.name}" is already assigned to ${client.brandName}`,
      );
    }

    return this.clientsRepository.addReviewer(clientId, reviewerId);
  }

  async removeReviewer(clientId: string, reviewerId: string) {
    await this.findOne(clientId);

    const updated = await this.clientsRepository.removeReviewer(clientId, reviewerId);
    return updated;
  }

  async findClientIdsForReviewer(reviewerId: string): Promise<string[]> {
    return this.clientsRepository.findClientIdsByReviewer(reviewerId);
  }
}
