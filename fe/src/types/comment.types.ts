export interface Comment {
  _id: string;
  post: string;
  author: {
    _id: string;
    name: string;
    email: string;
    role?: string;
  };
  message: string;
  createdAt: string;
}

export interface CreateCommentRequest {
  message: string;
}
