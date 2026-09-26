import { Platform } from '../types';

export const CAPTION_LIMITS: Record<Platform, number> = {
  [Platform.X]: 280,
  [Platform.INSTAGRAM]: 2200,
  [Platform.LINKEDIN]: 3000,
  [Platform.FACEBOOK]: 5000,
};

export const PLATFORM_CONFIGS: Record<
  Platform,
  { label: string; maxChars: number; color: string; badgeColor: string }
> = {
  [Platform.INSTAGRAM]: {
    label: 'Instagram',
    maxChars: 2200,
    color: 'from-pink-500 to-purple-600',
    badgeColor: 'bg-pink-100 text-pink-700 border-pink-200',
  },
  [Platform.FACEBOOK]: {
    label: 'Facebook',
    maxChars: 5000,
    color: 'from-blue-600 to-indigo-700',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  [Platform.LINKEDIN]: {
    label: 'LinkedIn',
    maxChars: 3000,
    color: 'from-sky-600 to-blue-800',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  [Platform.X]: {
    label: 'X (Twitter)',
    maxChars: 280,
    color: 'from-gray-900 to-black',
    badgeColor: 'bg-gray-100 text-gray-800 border-gray-300',
  },
};
