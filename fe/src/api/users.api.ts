import api from './axios';
import { User } from '../types';

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const res = await api.get<{ data: User[] }>('/users');
    return res.data.data;
  },

  getOne: async (id: string): Promise<User> => {
    const res = await api.get<{ data: User }>(`/users/${id}`);
    return res.data.data;
  },

  create: async (data: Partial<User> & { password?: string }): Promise<User> => {
    const res = await api.post<{ data: User }>('/users', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<User> & { password?: string }): Promise<User> => {
    const res = await api.patch<{ data: User }>(`/users/${id}`, data);
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
