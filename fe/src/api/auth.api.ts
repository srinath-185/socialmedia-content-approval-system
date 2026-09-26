import api from './axios';
import { LoginRequest, LoginResponse } from '../types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const res = await api.post<{ data: LoginResponse }>('/auth/login', credentials);
    return res.data.data;
  },
};
