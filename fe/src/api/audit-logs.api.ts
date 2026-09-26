import api from './axios';
import { AuditLog } from '../types';

export const auditLogsApi = {
  getByPost: async (postId: string): Promise<AuditLog[]> => {
    const res = await api.get<{ data: AuditLog[] }>(`/posts/${postId}/audit-logs`);
    return res.data.data;
  },
};
