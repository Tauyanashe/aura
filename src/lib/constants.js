export const APP_CONFIG = {
  NAME: 'AURA',
  VERSION: '0.9.0-beta',
  STORAGE_ADAPTER: 'Google Drive Beta / Mock',
  MAX_UPLOAD_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
};

export const REPUTATION_TIERS = [
  { name: 'Novice', minScore: 0, color: 'text-slate-400', badge: '🌱' },
  { name: 'Apprentice', minScore: 250, color: 'text-blue-400', badge: '⚡' },
  { name: 'Artisan', minScore: 500, color: 'text-purple-400', badge: '🔮' },
  { name: 'Aura Master', minScore: 1000, color: 'text-amber-400', badge: '👑' },
  { name: 'Legend', minScore: 2000, color: 'text-rose-400', badge: '✨' },
];

export const FARMS_CATALOGUE = [
  {
    id: 'farm-free',
    name: 'Free Farm',
    slug: 'free-farm',
    description: 'Starter capacity for all verified beta testers.',
    monthlyPrice: 0.00,
    monthlyPostLimit: 3,
    storageLimitBytes: 250 * 1024 * 1024, // 250 MB
    storageFormatted: '250 MB',
    isFreeTier: true,
    features: ['3 posts per month', '250 MB Drive Storage', 'Community Feed Access', 'Earn Aura Points'],
  },
  {
    id: 'farm-pioneer',
    name: 'Pioneer Farm',
    slug: 'pioneer-farm',
    description: 'For active weekly creators building a personal audience.',
    monthlyPrice: 4.99,
    monthlyPostLimit: 30,
    storageLimitBytes: 2 * 1024 * 1024 * 1024, // 2 GB
    storageFormatted: '2 GB',
    isFreeTier: false,
    features: ['30 posts per month', '2 GB Drive Storage', 'Priority Stream Bandwidth', 'Pioneer Badge', 'Simulated Beta Purchase'],
  },
  {
    id: 'farm-creator-pro',
    name: 'Creator Pro Farm',
    slug: 'creator-pro-farm',
    description: 'High capacity for daily storytellers and video creators.',
    monthlyPrice: 14.99,
    monthlyPostLimit: 150,
    storageLimitBytes: 10 * 1024 * 1024 * 1024, // 10 GB
    storageFormatted: '10 GB',
    isFreeTier: false,
    features: ['150 posts per month', '10 GB Drive Storage', 'Short Video Support', 'Pro Creator Flair', 'Simulated Beta Purchase'],
  },
];

export const AP_REWARDS = {
  POST_PUBLISH: 25,
  LIKE_RECEIVED: 2,
  COMMENT_RECEIVED: 5,
  RATING_GIVEN: 2,
  WELCOME_BONUS: 100,
  DAILY_ENGAGEMENT_CAP: 200,
};
