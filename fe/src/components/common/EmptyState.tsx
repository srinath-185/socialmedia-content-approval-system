import React from 'react';
import { FolderX } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white/50">
    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
      {icon || <FolderX className="w-6 h-6" />}
    </div>
    <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-slate-500 max-w-sm mb-5">{description}</p>
    )}
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
      >
        {actionText}
      </button>
    )}
  </div>
);
