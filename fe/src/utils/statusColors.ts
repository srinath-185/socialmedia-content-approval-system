import { PostStatus } from '../types';

export const STATUS_UI: Record<
  PostStatus,
  {
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    dotColor: string;
    headerBg: string;
  }
> = {
  [PostStatus.DRAFT]: {
    label: 'Draft',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    dotColor: 'bg-slate-400',
    headerBg: 'bg-slate-50',
  },
  [PostStatus.IN_REVIEW]: {
    label: 'In Review',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500',
    headerBg: 'bg-blue-50/50',
  },
  [PostStatus.CHANGES_REQUESTED]: {
    label: 'Changes Requested',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    dotColor: 'bg-amber-500',
    headerBg: 'bg-amber-50/50',
  },
  [PostStatus.APPROVED]: {
    label: 'Approved',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    headerBg: 'bg-emerald-50/50',
  },
  [PostStatus.SCHEDULED]: {
    label: 'Scheduled',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    dotColor: 'bg-purple-500',
    headerBg: 'bg-purple-50/50',
  },
  [PostStatus.PUBLISHED]: {
    label: 'Published',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
    dotColor: 'bg-teal-500',
    headerBg: 'bg-teal-50/50',
  },
};
