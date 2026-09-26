export enum PostStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
}

export const VALID_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
  [PostStatus.DRAFT]: [PostStatus.IN_REVIEW],
  [PostStatus.IN_REVIEW]: [PostStatus.APPROVED, PostStatus.CHANGES_REQUESTED],
  [PostStatus.CHANGES_REQUESTED]: [PostStatus.IN_REVIEW],
  [PostStatus.APPROVED]: [PostStatus.SCHEDULED],
  [PostStatus.SCHEDULED]: [PostStatus.PUBLISHED],
  [PostStatus.PUBLISHED]: [],
};
