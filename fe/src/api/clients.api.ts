import api from './axios';
import {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  AssignReviewerRequest,
} from '../types';

export const clientsApi = {
  getAll: async (): Promise<Client[]> => {
    const res = await api.get<{ data: Client[] }>('/clients');
    return res.data.data;
  },

  getOne: async (id: string): Promise<Client> => {
    const res = await api.get<{ data: Client }>(`/clients/${id}`);
    return res.data.data;
  },

  create: async (data: CreateClientRequest): Promise<Client> => {
    const res = await api.post<{ data: Client }>('/clients', data);
    return res.data.data;
  },

  update: async (id: string, data: UpdateClientRequest): Promise<Client> => {
    const res = await api.patch<{ data: Client }>(`/clients/${id}`, data);
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },

  assignReviewer: async (clientId: string, data: AssignReviewerRequest): Promise<Client> => {
    const res = await api.post<{ data: Client }>(`/clients/${clientId}/reviewers`, data);
    return res.data.data;
  },

  removeReviewer: async (clientId: string, reviewerId: string): Promise<Client> => {
    const res = await api.delete<{ data: Client }>(`/clients/${clientId}/reviewers/${reviewerId}`);
    return res.data.data;
  },
};
