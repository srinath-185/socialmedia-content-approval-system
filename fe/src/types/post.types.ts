export enum Platform {
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  LINKEDIN = 'LINKEDIN',
  X = 'X',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
}

export interface Post {
  _id: string;
  client: {
    _id: string;
    brandName: string;
    reviewers?: Array<{ _id: string; name: string; email: string }>;
  };
  platform: Platform;
  caption: string;
  scheduledAt: string | null;
  status: PostStatus;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    role?: string;
  };
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostRequest {
  client: string;
  platform: Platform;
  caption: string;
  scheduledAt?: string;
}

export interface UpdatePostRequest {
  platform?: Platform;
  caption?: string;
  scheduledAt?: string;
  version: number;
}

export interface TransitionPostRequest {
  toStatus: PostStatus;
  version: number;
  comment?: string;
  scheduledAt?: string;
}
