import React from 'react';
import { PostStatus } from '../../types';
import { STATUS_UI } from '../../utils/statusColors';

export const StatusBadge: React.FC<{ status: PostStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const ui = STATUS_UI[status] || STATUS_UI[PostStatus.DRAFT];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${ui.bgColor} ${ui.textColor} ${ui.borderColor} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ui.dotColor}`} />
      <span>{ui.label}</span>
    </span>
  );
};
