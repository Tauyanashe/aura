import React, { useState } from 'react';
import { Sparkles, Crown, UserPlus, UserCheck, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';

const SUGGESTED_CREATORS = [
  {
    id: 'user-sylvia-004',
    displayName: 'Sylvia Chen',
    username: 'sylvia_art',
    tier: 'Legend',
    gender: 'female',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    tagline: 'Cyberpunk & low-light photography',
  },
  {
    id: 'user-marcus-003',
    displayName: 'Marcus Thorne',
    username: 'marcus_k',
    tier: 'Aura Master',
    gender: 'male',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    tagline: 'Modular synth soundscapes',
  },
  {
    id: 'user-elena-001',
    displayName: 'Elena Rostova',
    username: 'elena_v',
    tier: 'Artisan',
    gender: 'female',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    tagline: 'Generative chromatic pattern experiments',
  },
];

const TRENDING_TOPICS = [
  { tag: '#GenerativePattern', count: '1.4k AP' },
  { tag: '#SoundArchitecture', count: '980 AP' },
  { tag: '#CyberpunkNoir', count: '840 AP' },
  { tag: '#VirtualFarms', count: '620 AP' },
];

export function RightSidebar({ onViewProfile, setActiveTab, currentUser, onToast }) {
  const [followingMap, setFollowingMap] = useState({});

  const toggleFollow = (creatorId, e) => {
    e.stopPropagation();
    setFollowingMap(prev => {
      const nextState = !prev[creatorId];
      if (onToast) {
        onToast(nextState ? 'Following creator' : 'Unfollowed creator');
      }
      return { ...prev, [creatorId]: nextState };
    });
  };

  const visibleCreators = SUGGESTED_CREATORS.filter(c => c.id !== currentUser?.id);

  return (
    <aside className="w-80 flex-shrink-0 hidden xl:block">
      <div className="sticky top-20 space-y-5">
        {/* Suggested Royalty to Follow */}
        <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <h3 className="font-black text-xs uppercase tracking-wider text-white">Rising Royalty</h3>
            </div>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className="text-[11px] font-bold text-purple-400 hover:text-purple-300 transition"
            >
              See All
            </button>
          </div>

          <div className="space-y-3">
            {visibleCreators.map((creator) => {
              const isFollowing = !!followingMap[creator.id];
              return (
                <div
                  key={creator.id}
                  onClick={() => onViewProfile && onViewProfile(creator.id)}
                  className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-slate-800/40 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={creator.avatar}
                      alt={creator.displayName}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500/20 group-hover:ring-purple-400 transition flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-xs text-slate-100 group-hover:text-purple-300 transition truncate">
                          {creator.displayName}
                        </span>
                        <span className="text-[10px] text-amber-400 font-bold">
                          {creator.gender === 'female' ? '♀' : '♂'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate">
                        @{creator.username}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => toggleFollow(creator.id, e)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 flex-shrink-0 ${
                      isFollowing
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : 'bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-3 h-3 text-emerald-400" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trending Community Topics */}
        <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-3.5">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Trending Tags
          </div>

          <div className="space-y-2">
            {TRENDING_TOPICS.map((topic) => (
              <div
                key={topic.tag}
                onClick={() => setActiveTab('explore')}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/40 cursor-pointer transition text-xs"
              >
                <span className="font-semibold text-slate-200 hover:text-purple-300 transition">
                  {topic.tag}
                </span>
                <span className="text-[10px] font-mono font-bold text-purple-400 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                  {topic.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Integrity Card */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800/80 space-y-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Anti-Fraud Consensus
          </div>
          <p className="leading-relaxed">
            All Aura Points (AP) and Aura Scores (AS) are calculated via tamper-proof atomic procedures. Self-rating is strictly prohibited.
          </p>
        </div>
      </div>
    </aside>
  );
}
