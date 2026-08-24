export const DEFAULT_ASSETS = {
  EVENT_BANNER: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80',
  EVENT_CARD_BANNER: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
  DICEBEAR_AVATAR_BASE: 'https://api.dicebear.com/7.x/avataaars/svg?seed=',
} as const;

export function getDicebearAvatarUrl(seed: string): string {
  return `${DEFAULT_ASSETS.DICEBEAR_AVATAR_BASE}${encodeURIComponent(seed || 'User')}`;
}
