import React from 'react';
import { Platform } from '../../types';
import { PLATFORM_CONFIGS } from '../../utils/platformLimits';
import { formatToIST } from '../../utils/dateUtils';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share2,
  ThumbsUp,
  MoreHorizontal,
  Send,
} from 'lucide-react';

interface PostPreviewProps {
  brandName?: string;
  platform: Platform;
  caption: string;
  scheduledAt?: string;
}

export const PostPreview: React.FC<PostPreviewProps> = ({
  brandName = 'Client Brand',
  platform,
  caption,
  scheduledAt,
}) => {
  const config = PLATFORM_CONFIGS[platform];
  const displayCaption = caption.trim() || 'Your post caption will appear here in real time...';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Top Card Bar */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Feed Preview
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badgeColor}`}
        >
          {config.label}
        </span>
      </div>

      {/* Social Post Mockup Canvas */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Post Header */}
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                {brandName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {brandName}
                </div>
                <div className="text-[11px] text-slate-400">
                  {scheduledAt ? formatToIST(scheduledAt) : 'Draft Preview'}
                </div>
              </div>
            </div>
            <MoreHorizontal className="w-4 h-4 text-slate-400" />
          </div>

          {/* Caption */}
          <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed mb-4">
            {displayCaption}
          </div>

          {/* Media placeholder visual */}
          <div className="w-full h-44 rounded-xl bg-gradient-to-br from-slate-100 to-indigo-50/40 border border-slate-100 flex flex-col items-center justify-center text-slate-400 text-xs">
            <span className="font-semibold text-slate-500">Post Visual / Media</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Optimized for {config.label}</span>
          </div>
        </div>

        {/* Platform-specific Actions Footer */}
        <div className="pt-4 mt-4 border-t border-slate-100">
          {platform === Platform.INSTAGRAM && (
            <div className="flex items-center justify-between text-slate-700">
              <div className="flex items-center gap-4">
                <Heart className="w-5 h-5 cursor-pointer hover:text-rose-500 transition" />
                <MessageCircle className="w-5 h-5 cursor-pointer hover:text-indigo-600 transition" />
                <Send className="w-4 h-4 cursor-pointer hover:text-indigo-600 transition" />
              </div>
              <Bookmark className="w-5 h-5 cursor-pointer hover:text-slate-900 transition" />
            </div>
          )}

          {platform === Platform.FACEBOOK && (
            <div className="flex items-center justify-around text-slate-600 text-xs font-medium pt-1">
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
                <ThumbsUp className="w-4 h-4" /> Like
              </div>
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
                <MessageCircle className="w-4 h-4" /> Comment
              </div>
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
                <Share2 className="w-4 h-4" /> Share
              </div>
            </div>
          )}

          {platform === Platform.LINKEDIN && (
            <div className="flex items-center justify-around text-slate-600 text-xs font-medium pt-1">
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-sky-700">
                <ThumbsUp className="w-4 h-4" /> Like
              </div>
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-sky-700">
                <MessageCircle className="w-4 h-4" /> Comment
              </div>
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-sky-700">
                <Repeat2 className="w-4 h-4" /> Repost
              </div>
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-sky-700">
                <Send className="w-3.5 h-3.5" /> Send
              </div>
            </div>
          )}

          {platform === Platform.X && (
            <div className="flex items-center justify-around text-slate-500 text-xs pt-1">
              <MessageCircle className="w-4 h-4 cursor-pointer hover:text-sky-500" />
              <Repeat2 className="w-4 h-4 cursor-pointer hover:text-emerald-500" />
              <Heart className="w-4 h-4 cursor-pointer hover:text-rose-500" />
              <Bookmark className="w-4 h-4 cursor-pointer hover:text-sky-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
