import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Post, Platform } from '../../types';
import { StatusBadge } from './StatusBadge';
import { formatToIST } from '../../utils/dateUtils';
import { PLATFORM_CONFIGS } from '../../utils/platformLimits';
import { Calendar, Clock, User, ChevronRight } from 'lucide-react';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const navigate = useNavigate();
  const platformConfig = PLATFORM_CONFIGS[post.platform] || {
    label: post.platform,
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  return (
    <div
      onClick={() => navigate(`/posts/${post._id}`)}
      className="group bg-white rounded-xl border border-slate-200/90 p-4 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Meta: Client Brand & Platform */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-bold text-slate-900 tracking-tight truncate">
            {post.client?.brandName || 'Unassigned Client'}
          </span>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 uppercase tracking-wider ${platformConfig.badgeColor}`}
          >
            {platformConfig.label}
          </span>
        </div>

        {/* Caption Preview */}
        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3 font-normal">
          {post.caption}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
        {/* Scheduled time in IST if present */}
        {post.scheduledAt && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-700 bg-indigo-50/70 px-2 py-1 rounded-md">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">{formatToIST(post.scheduledAt)}</span>
          </div>
        )}

        {/* Bottom Bar: Version, Creator & Status */}
        <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <User className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate font-medium text-slate-600">
              {post.createdBy?.name || 'Creator'}
            </span>
            <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-mono text-slate-500">
              v{post.version}
            </span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
        </div>
      </div>
    </div>
  );
};
