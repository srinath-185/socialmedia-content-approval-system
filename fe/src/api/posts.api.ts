import api from './axios';
import {
  Post,
  CreatePostRequest,
  UpdatePostRequest,
  TransitionPostRequest,
} from '../types';

export const postsApi = {
  getAll: async (filters?: { client?: string; platform?: string; status?: string }): Promise<Post[]> => {
    const res = await api.get<{ data: Post[] }>('/posts', { params: filters });
    return res.data.data;
  },

  getOne: async (id: string): Promise<Post> => {
    const res = await api.get<{ data: Post }>(`/posts/${id}`);
    return res.data.data;
  },

  create: async (data: CreatePostRequest): Promise<Post> => {
    const res = await api.post<{ data: Post }>('/posts', data);
    return res.data.data;
  },

  update: async (id: string, data: UpdatePostRequest): Promise<Post> => {
    const res = await api.patch<{ data: Post }>(`/posts/${id}`, data);
    return res.data.data;
  },

  transition: async (id: string, data: TransitionPostRequest): Promise<Post> => {
    const res = await api.post<{ data: Post }>(`/posts/${id}/transition`, data);
    return res.data.data;
  },
};
