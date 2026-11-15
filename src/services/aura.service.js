import { supabase, isMockMode } from '../lib/supabase';
import { REPUTATION_TIERS } from '../lib/constants';

const MOCK_AURA_KEY = 'aura_mock_wallets';

export const auraService = {
  async getWallet(userId) {
    if (isMockMode) {
      const stored = localStorage.getItem(`${MOCK_AURA_KEY}_${userId}`);
      if (stored) return JSON.parse(stored);

      const defaultWallet = {
        userId,
        balance: 420,
        lifetimeEarned: 520,
        transactions: [
          {
            id: 'tx-welcome',
            amount: 100,
            transactionType: 'welcome_bonus',
            description: 'Beta membership welcome gift',
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          },
          {
            id: 'tx-post-1',
            amount: 25,
            transactionType: 'post_published',
            description: 'Post published: Generative Horizons',
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          },
          {
            id: 'tx-rating-1',
            amount: 10,
            transactionType: 'rating_received',
            description: '5-star rating received from community',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      };
      localStorage.setItem(`${MOCK_AURA_KEY}_${userId}`, JSON.stringify(defaultWallet));
      return defaultWallet;
    }

    const { data: wallet, error: wError } = await supabase
      .from('aura_wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (wError) throw wError;

    const { data: transactions } = await supabase
      .from('aura_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    return {
      userId,
      balance: wallet.balance,
      lifetimeEarned: wallet.lifetime_earned,
      transactions: transactions || [],
    };
  },

  async getAuraScore(userId) {
    if (isMockMode) {
      return {
        userId,
        score: 780,
        tier: 'Artisan',
        postsPublishedScore: 120,
        ratingsAverageScore: 480,
        communityEngagementScore: 180,
        penaltiesScore: 0,
        nextTierThreshold: 1000,
        calculatedAt: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase
      .from('aura_scores')
      .select('*')
      .eq('user_id', userId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Calculate fresh if none found
      const { data: freshScore } = await supabase.rpc('fn_calculate_aura_score', { p_user_id: userId });
      return { score: freshScore || 100, tier: 'Novice' };
    }

    return data;
  },

  async getLeaderboard() {
    if (isMockMode) {
      // Leaderboard starts empty — populated by real user activity
      return [];
    }

    const { data, error } = await supabase
      .from('aura_scores')
      .select('score, tier, profiles(username, display_name, avatar_media_id)')
      .order('score', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data;
  },

  getTierInfo(score) {
    const sorted = [...REPUTATION_TIERS].sort((a, b) => b.minScore - a.minScore);
    return sorted.find(t => score >= t.minScore) || REPUTATION_TIERS[0];
  },
};
