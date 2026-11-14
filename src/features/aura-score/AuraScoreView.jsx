import React from 'react';
import { Sparkles, Shield, Star, MessageSquare, AlertOctagon, TrendingUp } from 'lucide-react';
import { REPUTATION_TIERS } from '../../lib/constants';

export function AuraScoreView({ auraScore, currentUser }) {
  const currentScore = auraScore?.score || 100;
  const currentTier = REPUTATION_TIERS.slice().reverse().find(t => currentScore >= t.minScore) || REPUTATION_TIERS[0];
  const nextTierIndex = REPUTATION_TIERS.findIndex(t => t.name === currentTier.name) + 1;
  const nextTier = REPUTATION_TIERS[nextTierIndex];

  const progressPercent = nextTier
    ? Math.min(100, Math.round(((currentScore - currentTier.minScore) / (nextTier.minScore - currentTier.minScore)) * 100))
    : 100;

  return (
    <div className="space-y-6">
      {/* Score Hero Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30">
        <div className="max-w-xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentTier.badge}</span>
            <span className="text-xs uppercase tracking-widest font-extrabold text-purple-300">
              AURA Reputation Score
            </span>
          </div>

          <div className="flex items-baseline gap-4">
            <span className="text-6xl font-black text-white tracking-tight">{currentScore}</span>
            <span className="text-xl font-bold text-purple-300">AS</span>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 ${currentTier.color}`}>
              {currentTier.name}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Your Aura Score reflects verified quality, community ratings, and peer interactions. Unlike follower counts, Aura Score cannot be bought or inflated through engagement rings.
          </p>

          {/* Tier Progress */}
          {nextTier && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Progress to <strong>{nextTier.name}</strong></span>
                <span className="text-purple-300 font-bold">{currentScore} / {nextTier.minScore} AS</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Content Publication Score
            </span>
            <span className="text-sm font-bold text-emerald-400">+{auraScore?.postsPublishedScore || 120}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Earned through publishing original media within your monthly farm allowances.
          </p>
        </div>

        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Peer Rating Quality
            </span>
            <span className="text-sm font-bold text-emerald-400">+{auraScore?.ratingsAverageScore || 480}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Weighted ratings received from fellow creators. Self-ratings are excluded.
          </p>
        </div>

        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Community Engagement
            </span>
            <span className="text-sm font-bold text-emerald-400">+{auraScore?.communityEngagementScore || 180}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Discussion contributions and constructive discussions across the beta network.
          </p>
        </div>

        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              Moderation Deductions
            </span>
            <span className="text-sm font-bold text-slate-400">-{auraScore?.penaltiesScore || 0}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Penalties incurred from copyright warnings, spam, or community guideline breaches.
          </p>
        </div>
      </div>
    </div>
  );
}
