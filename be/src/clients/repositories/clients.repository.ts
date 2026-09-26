import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Client, ClientDocument } from '../schemas/client.schema';

@Injectable()
export class ClientsRepository {
  constructor(
    @InjectModel(Client.name) private readonly clientModel: Model<ClientDocument>,
  ) {}

  async create(brandName: string): Promise<ClientDocument> {
    const client = new this.clientModel({ brandName: brandName.trim(), reviewers: [] });
    return client.save();
  }

  async findById(id: string): Promise<ClientDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.clientModel
      .findById(id)
      .populate('reviewers', 'name email role')
      .exec();
  }

  async findByBrandName(brandName: string, excludeId?: string): Promise<ClientDocument | null> {
    const query: any = {
      brandName: { $regex: new RegExp(`^${brandName.trim()}$`, 'i') },
    };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }
    return this.clientModel.findOne(query).exec();
  }

  async findAll(reviewerId?: string): Promise<ClientDocument[]> {
    const query: any = {};
    if (reviewerId && Types.ObjectId.isValid(reviewerId)) {
      query.reviewers = new Types.ObjectId(reviewerId);
    }
    return this.clientModel
      .find(query)
      .populate('reviewers', 'name email role')
      .sort({ brandName: 1 })
      .exec();
  }

  async findClientIdsByReviewer(reviewerId: string): Promise<string[]> {
    if (!Types.ObjectId.isValid(reviewerId)) return [];
    const clients = await this.clientModel
      .find({ reviewers: new Types.ObjectId(reviewerId) })
      .select('_id')
      .exec();
    return clients.map((c) => c._id.toString());
  }

  async update(id: string, updates: Partial<Client>): Promise<ClientDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.clientModel
      .findByIdAndUpdate(id, updates, { new: true })
      .populate('reviewers', 'name email role')
      .exec();
  }

  async delete(id: string): Promise<ClientDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.clientModel.findByIdAndDelete(id).exec();
  }

  async addReviewer(clientId: string, reviewerId: string): Promise<ClientDocument | null> {
    if (!Types.ObjectId.isValid(clientId) || !Types.ObjectId.isValid(reviewerId)) return null;
    return this.clientModel
      .findByIdAndUpdate(
        clientId,
        { $addToSet: { reviewers: new Types.ObjectId(reviewerId) } },
        { new: true },
      )
      .populate('reviewers', 'name email role')
      .exec();
  }

  async removeReviewer(clientId: string, reviewerId: string): Promise<ClientDocument | null> {
    if (!Types.ObjectId.isValid(clientId) || !Types.ObjectId.isValid(reviewerId)) return null;
    return this.clientModel
      .findByIdAndUpdate(
        clientId,
        { $pull: { reviewers: new Types.ObjectId(reviewerId) } },
        { new: true },
      )
      .populate('reviewers', 'name email role')
      .exec();
  }
}
