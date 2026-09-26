import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Client, ClientDocument } from './schemas/client.schema';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createClientDto: CreateClientDto) {
    const existing = await this.clientModel.findOne({
      brandName: { $regex: new RegExp(`^${createClientDto.brandName.trim()}$`, 'i') },
    }).exec();

    if (existing) {
      throw new ConflictException(`Client brand "${createClientDto.brandName}" already exists`);
    }

    const client = new this.clientModel({
      brandName: createClientDto.brandName.trim(),
      reviewers: [],
    });

    return client.save();
  }

  async findAll(user?: { userId: string; role: string }) {
    const query: any = {};
    if (user && user.role === Role.REVIEWER) {
      query.reviewers = new Types.ObjectId(user.userId);
    }
    return this.clientModel
      .find(query)
      .populate('reviewers', 'name email role')
      .sort({ brandName: 1 })
      .exec();
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid client ID format: "${id}"`);
    }
    const client = await this.clientModel
      .findById(id)
      .populate('reviewers', 'name email role')
      .exec();
    if (!client) {
      throw new NotFoundException(`Client with ID "${id}" not found`);
    }
    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    const client = await this.findOne(id);

    const trimmedName = updateClientDto.brandName.trim();
    if (trimmedName.toLowerCase() !== client.brandName.toLowerCase()) {
      const duplicate = await this.clientModel.findOne({
        brandName: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
        _id: { $ne: id },
      }).exec();
      if (duplicate) {
        throw new ConflictException(`Client brand "${trimmedName}" already exists`);
      }
      client.brandName = trimmedName;
    }

    return client.save();
  }

  async remove(id: string) {
    const client = await this.findOne(id);
    await this.clientModel.findByIdAndDelete(id).exec();
    return { success: true, message: `Client "${client.brandName}" successfully deleted` };
  }

  async assignReviewer(clientId: string, reviewerId: string) {
    const client = await this.findOne(clientId);

    if (!Types.ObjectId.isValid(reviewerId)) {
      throw new BadRequestException(`Invalid reviewer ID: "${reviewerId}"`);
    }

    const reviewer = await this.userModel.findById(reviewerId).exec();
    if (!reviewer) {
      throw new NotFoundException(`Reviewer with ID "${reviewerId}" not found`);
    }

    if (reviewer.role !== Role.REVIEWER) {
      throw new BadRequestException(
        `User "${reviewer.name}" has role ${reviewer.role}. Only users with role REVIEWER can be assigned to clients.`,
      );
    }

    const reviewerObjectId = new Types.ObjectId(reviewerId);
    const isAlreadyAssigned = client.reviewers.some(
      (r: any) => r._id?.toString() === reviewerId || r.toString() === reviewerId,
    );

    if (isAlreadyAssigned) {
      throw new ConflictException(`Reviewer "${reviewer.name}" is already assigned to ${client.brandName}`);
    }

    client.reviewers.push(reviewerObjectId);
    await client.save();

    return this.findOne(clientId);
  }

  async removeReviewer(clientId: string, reviewerId: string) {
    const client = await this.findOne(clientId);

    const initialCount = client.reviewers.length;
    client.reviewers = client.reviewers.filter(
      (r: any) => (r._id ? r._id.toString() : r.toString()) !== reviewerId,
    );

    if (client.reviewers.length === initialCount) {
      throw new NotFoundException(`Reviewer "${reviewerId}" was not assigned to this client`);
    }

    await client.save();
    return this.findOne(clientId);
  }

  async findClientIdsForReviewer(reviewerId: string): Promise<string[]> {
    const clients = await this.clientModel.find({
      reviewers: new Types.ObjectId(reviewerId),
    }).select('_id').exec();
    return clients.map((c) => c._id.toString());
  }
}
