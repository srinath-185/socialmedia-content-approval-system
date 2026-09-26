import React, { useState } from 'react';
import { Comment } from '../../types';
import { formatRelativeIST } from '../../utils/dateUtils';
import { MessageSquare, Send, User } from 'lucide-react';

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (message: string) => Promise<void>;
  isLoading?: boolean;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  comments,
  onAddComment,
  isLoading = false,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newMessage.trim());
      setNewMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No feedback or comments recorded yet.
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                    {comment.author?.name ? comment.author.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                  </div>
                  <span className="text-xs font-semibold text-slate-800">
                    {comment.author?.name || 'Reviewer'}
                  </span>
                  {comment.author?.role && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-slate-500 font-medium">
                      {comment.author.role}
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-slate-400">
                  {formatRelativeIST(comment.createdAt)}
                </span>
              </div>

              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed pl-8">
                {comment.message}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Input Form */}
      <form onSubmit={handleSubmit} className="pt-2 border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Leave a comment or editorial note..."
          disabled={isLoading || isSubmitting}
          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 transition"
        />

        <button
          type="submit"
          disabled={!newMessage.trim() || isSubmitting || isLoading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Post</span>
        </button>
      </form>
    </div>
  );
};
