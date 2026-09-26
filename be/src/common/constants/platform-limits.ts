import { Platform } from '../enums/platform.enum';

export const CAPTION_LIMITS: Record<Platform, number> = {
  [Platform.X]: 280,
  [Platform.INSTAGRAM]: 2200,
  [Platform.LINKEDIN]: 3000,
  [Platform.FACEBOOK]: 5000,
};
