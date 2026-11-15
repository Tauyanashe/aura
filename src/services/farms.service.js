import { supabase, isMockMode } from '../lib/supabase';
import { FARMS_CATALOGUE } from '../lib/constants';

const MOCK_FARMS_KEY = 'aura_mock_user_farms';

export const farmsService = {
  async getCatalogue() {
    if (isMockMode) {
      return FARMS_CATALOGUE;
    }
    const { data, error } = await supabase.from('farms').select('*').order('monthly_price');
    if (error) throw error;
    return data;
  },

  async getUserFarmStatus(userId) {
    if (isMockMode) {
      const stored = localStorage.getItem(`${MOCK_FARMS_KEY}_${userId}`);
      let userFarms = stored ? JSON.parse(stored) : [FARMS_CATALOGUE[0]]; // Free Farm default

      const totalStorage = userFarms.reduce((acc, f) => acc + (f.storageLimitBytes || f.storage_limit_bytes || 262144000), 0);
      const totalPostLimit = userFarms.reduce((acc, f) => acc + (f.monthlyPostLimit || f.monthly_post_limit || 3), 0);

      // Read current post count from posts storage
      const postsKey = 'aura_mock_posts';
      const allPosts = JSON.parse(localStorage.getItem(postsKey) || '[]');
      const userPublishedPosts = allPosts.filter(p => p.userId === userId && p.status === 'published');
      const postsUsed = userPublishedPosts.length;
      const storageUsed = userPublishedPosts.reduce((acc, p) => acc + (p.mediaAsset?.sizeBytes || 1500000), 0);

      return {
        activeFarms: userFarms,
        totalStorageBytes: totalStorage,
        storageUsedBytes: storageUsed,
        storageRemainingBytes: Math.max(0, totalStorage - storageUsed),
        storageUsagePercent: Math.min(100, Math.round((storageUsed / totalStorage) * 100)),
        postsLimit: totalPostLimit,
        postsUsed: postsUsed,
        postsRemaining: Math.max(0, totalPostLimit - postsUsed),
        currentCycle: {
          periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        },
      };
    }

    // Live Supabase RPC & Queries
    const { data: userFarms, error: ufError } = await supabase
      .from('user_farms')
      .select('*, farms(*)')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (ufError) throw ufError;

    const { data: cycle } = await supabase
      .from('farm_cycles')
      .select('*')
      .eq('user_id', userId)
      .lte('period_start', new Date().toISOString().split('T')[0])
      .gte('period_end', new Date().toISOString().split('T')[0])
      .single();

    const { data: mediaAssets } = await supabase
      .from('media_assets')
      .select('size_bytes')
      .eq('user_id', userId)
      .in('status', ['ready', 'uploaded']);

    const totalStorageBytes = (userFarms || []).reduce((acc, uf) => acc + (uf.farms?.storage_limit_bytes || 0), 0);
    const storageUsedBytes = (mediaAssets || []).reduce((acc, m) => acc + (m.size_bytes || 0), 0);

    return {
      activeFarms: userFarms || [],
      totalStorageBytes,
      storageUsedBytes,
      storageRemainingBytes: Math.max(0, totalStorageBytes - storageUsedBytes),
      storageUsagePercent: totalStorageBytes > 0 ? Math.round((storageUsedBytes / totalStorageBytes) * 100) : 0,
      postsLimit: cycle?.posts_limit || 3,
      postsUsed: cycle?.posts_used || 0,
      postsRemaining: Math.max(0, (cycle?.posts_limit || 3) - (cycle?.posts_used || 0)),
      currentCycle: cycle,
    };
  },

  async acquireFarm(userId, farmSlug) {
    const farm = FARMS_CATALOGUE.find(f => f.slug === farmSlug);
    if (!farm) throw new Error('Farm not found');

    if (isMockMode) {
      const stored = localStorage.getItem(`${MOCK_FARMS_KEY}_${userId}`);
      let userFarms = stored ? JSON.parse(stored) : [FARMS_CATALOGUE[0]];

      if (!userFarms.some(f => f.slug === farmSlug)) {
        userFarms.push(farm);
        localStorage.setItem(`${MOCK_FARMS_KEY}_${userId}`, JSON.stringify(userFarms));
      }
      return { success: true, farm };
    }

    const { data, error } = await supabase
      .from('user_farms')
      .insert({
        user_id: userId,
        farm_id: farm.id,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, farm: data };
  },

  async acquireSimulatedFarm(userId, farmSlug) {
    return this.acquireFarm(userId, farmSlug);
  },
};
