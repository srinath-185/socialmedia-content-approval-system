import React from 'react';
import { Post, PostStatus } from '../../types';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  posts: Post[];
}

const ORDERED_STATUSES: PostStatus[] = [
  PostStatus.DRAFT,
  PostStatus.IN_REVIEW,
  PostStatus.CHANGES_REQUESTED,
  PostStatus.APPROVED,
  PostStatus.SCHEDULED,
  PostStatus.PUBLISHED,
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ posts }) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[500px]">
      {ORDERED_STATUSES.map((status) => {
        const columnPosts = posts.filter((p) => p.status === status);
        return (
          <KanbanColumn key={status} status={status} posts={columnPosts} />
        );
      })}
    </div>
  );
};
