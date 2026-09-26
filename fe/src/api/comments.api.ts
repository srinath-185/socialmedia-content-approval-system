import api from './axios';
import { Comment, CreateCommentRequest } from '../types';

export const commentsApi = {
  getByPost: async (postId: string): Promise<Comment[]> => {
    const res = await api.get<{ data: Comment[] }>(`/posts/${postId}/comments`);
    return res.data.data;
  },

  create: async (postId: string, data: CreateCommentRequest): Promise<Comment> => {
    const res = await api.post<{ data: Comment }>(`/posts/${postId}/comments`, data);
    return res.data.data;
  },
};
