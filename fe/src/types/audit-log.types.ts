export interface AuditLog {
  _id: string;
  post: string;
  actor: string;
  fromStatus: string;
  toStatus: string;
  timestamp: string;
  actorInfo?: {
    name: string;
    email?: string;
    role?: string;
  };
}
