import { User } from './user.types';

export interface Client {
  _id: string;
  brandName: string;
  reviewers: User[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientRequest {
  brandName: string;
}

export interface UpdateClientRequest {
  brandName: string;
}

export interface AssignReviewerRequest {
  reviewerId: string;
}
