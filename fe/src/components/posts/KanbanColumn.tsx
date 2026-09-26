import React from 'react';
import { Post, PostStatus } from '../../types';
import { PostCard } from './PostCard';
import { STATUS_UI } from '../../utils/statusColors';

interface KanbanColumnProps {
  status: PostStatus;
  posts: Post[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, posts }) => {
  const ui = STATUS_UI[status] || STATUS_UI[PostStatus.DRAFT];

  return (
    <div className="flex flex-col w-72 shrink-0 rounded-2xl bg-slate-100/70 border border-slate-200/60 p-3 h-full max-h-[calc(100vh-13rem)]">
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-2.5">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${ui.dotColor}`} />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {ui.label}
          </h3>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 shadow-2xs">
          {posts.length}
        </span>
      </div>

      {/* Cards List with Scroll */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {posts.length === 0 ? (
          <div className="py-10 text-center rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
            No posts in {ui.label.toLowerCase()}
          </div>
        ) : (
          posts.map((post) => <PostCard key={post._id} post={post} />)
        )}
      </div>
    </div>
  );
};
