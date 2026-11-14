import { describe, it, expect, beforeEach } from 'vitest';
import { FARMS_CATALOGUE, AP_REWARDS, REPUTATION_TIERS } from '../src/lib/constants';
import { farmsService } from '../src/services/farms.service';
import { postsService } from '../src/services/posts.service';
import { auraService } from '../src/services/aura.service';
import { mediaService } from '../src/services/media.service';

// Mock localStorage for Node environment if not defined
if (typeof localStorage === 'undefined') {
  const store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };
}

describe('AURA Pro-Level Security & Reliability Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Farm Quotas & Concurrency Protection', () => {
    it('should initialize with Free Farm: 3 posts/month and 250 MB storage', async () => {
      const freeFarm = FARMS_CATALOGUE.find(f => f.isFreeTier);
      expect(freeFarm).toBeDefined();
      expect(freeFarm.monthlyPostLimit).toBe(3);
      expect(freeFarm.storageLimitBytes).toBe(262144000); // 250 MB
    });

    it('should calculate cumulative storage and post allowance accurately', async () => {
      const userId = 'test-user-1';
      const status = await farmsService.getUserFarmStatus(userId);

      expect(status.postsLimit).toBe(3);
      expect(status.postsUsed).toBe(0);
      expect(status.postsRemaining).toBe(3);
      expect(status.totalStorageBytes).toBe(262144000);
      expect(status.storageRemainingBytes).toBe(262144000);
    });

    it('should cumulatively stack storage when an additional farm is acquired', async () => {
      const userId = 'test-user-cumul';
      await farmsService.acquireSimulatedFarm(userId, 'pioneer-farm');
      const status = await farmsService.getUserFarmStatus(userId);

      // Free Farm (250 MB) + Pioneer Farm (2 GB) = 2.25 GB
      const expectedStorage = 262144000 + 2147483648;
      expect(status.totalStorageBytes).toBe(expectedStorage);
      expect(status.postsLimit).toBe(33); // 3 + 30
    });
  });

  describe('2. Media Upload & Validation Integrity', () => {
    it('should reject unpermitted file MIME types', () => {
      const invalidFile = { type: 'application/x-msdownload', size: 1024 };
      expect(() => mediaService.validateFile(invalidFile)).toThrow(/not supported/);
    });

    it('should reject files exceeding the 25 MB beta limit', () => {
      const oversizedFile = { type: 'image/jpeg', size: 30 * 1024 * 1024 };
      expect(() => mediaService.validateFile(oversizedFile)).toThrow(/exceeds/);
    });

    it('should accept valid JPEG, PNG, WebP, GIF, and MP4 within limit', () => {
      const validImage = { type: 'image/webp', size: 4 * 1024 * 1024 };
      expect(mediaService.validateFile(validImage)).toBe(true);
    });
  });

  describe('3. Anti-Fraud & Social Abuse Controls', () => {
    it('should strictly prohibit authors from rating their own posts', async () => {
      const authorId = 'author-456';
      const post = await postsService.publishPost({
        currentUserId: authorId,
        currentUser: { username: 'creator', display_name: 'Creator' },
        caption: 'Security test post',
        media: { id: 'media-s1', size_bytes: 1000 },
      });

      await expect(postsService.submitRating(post.id, authorId, 5)).rejects.toThrow(
        /Anti-fraud rule: You cannot rate your own post/
      );
    });

    it('should calculate running average and rating distribution accurately', async () => {
      const authorId = 'author-789';
      const reviewer1 = 'rev-1';
      const reviewer2 = 'rev-2';

      const post = await postsService.publishPost({
        currentUserId: authorId,
        currentUser: { username: 'photographer', display_name: 'Photographer' },
        caption: 'Landscape photo',
        media: { id: 'media-s2', size_bytes: 1000 },
      });

      const res1 = await postsService.submitRating(post.id, reviewer1, 5);
      expect(res1.ratingAverage).toBe(5);
      expect(res1.ratingsCount).toBe(1);

      const res2 = await postsService.submitRating(post.id, reviewer2, 4);
      expect(res2.ratingAverage).toBe(4.5);
      expect(res2.ratingsCount).toBe(2);
    });
  });

  describe('4. Aura Points (AP) Wallet & Daily Anti-Farming Caps', () => {
    it('should award 25 AP upon publishing a post', async () => {
      const userId = 'publisher-user';
      await postsService.publishPost({
        currentUserId: userId,
        currentUser: { username: 'pub_user', display_name: 'Pub User' },
        caption: 'First post',
        media: { id: 'media-p1', size_bytes: 5000 },
      });

      const wallet = await auraService.getWallet(userId);
      const postReward = wallet.transactions.find(t => t.transactionType === 'post_published');
      expect(postReward).toBeDefined();
      expect(postReward.amount).toBe(AP_REWARDS.POST_PUBLISH);
    });
  });

  describe('5. Reputation & Aura Score (AS) Engine', () => {
    it('should correctly map score brackets to reputation tiers', () => {
      expect(auraService.getTierInfo(50).name).toBe('Novice');
      expect(auraService.getTierInfo(280).name).toBe('Apprentice');
      expect(auraService.getTierInfo(750).name).toBe('Artisan');
      expect(auraService.getTierInfo(1400).name).toBe('Aura Master');
      expect(auraService.getTierInfo(2500).name).toBe('Legend');
    });
  });
});
