export enum Role {
  ADMIN = 'ADMIN',
  CREATOR = 'CREATOR',
  REVIEWER = 'REVIEWER',
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: Role;
  };
}
