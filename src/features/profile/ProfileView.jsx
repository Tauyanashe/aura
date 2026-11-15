import React, { useState, useEffect } from 'react';
import {
  User, Lock, Globe, Shield, Calendar, ArrowLeft,
  UserPlus, UserCheck, MessageSquare, Sparkles, Grid3x3, Heart
} from 'lucide-react';
import { Button } from '../../components/common/Button';

// ─── Mock creator profiles for public viewing ─────────────────────────────
const MOCK_CREATOR_PROFILES = {
  'user-elena-001': {
    id: 'user-elena-001',
    username: 'elena_v',
    display_name: 'Elena Rostova',
    bio: 'Digital artist & photographer exploring generative visual patterns.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    tier: 'Artisan',
    auraScore: 840,
    is_private: false,
    gender: 'female',
    followers: 1247,
    following: 83,
    postsCount: 14,
    joinedDate: 'Sep 2026',
  },
  'user-marcus-003': {
    id: 'user-marcus-003',
    username: 'marcus_k',
    display_name: 'Marcus Thorne',
    bio: 'Modular analog synth soundscapes & architecture photographer.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    tier: 'Aura Master',
    auraScore: 1980,
    is_private: false,
    gender: 'male',
    followers: 3821,
    following: 102,
    postsCount: 29,
    joinedDate: 'Aug 2026',
  },
  'user-sylvia-004': {
    id: 'user-sylvia-004',
    username: 'sylvia_art',
    display_name: 'Sylvia Chen',
    bio: 'Cyberpunk & wet pavement low-light photography. Legend tier creator.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    tier: 'Legend',
    auraScore: 2890,
    is_private: false,
    gender: 'female',
    followers: 8640,
    following: 44,
    postsCount: 47,
    joinedDate: 'Jul 2026',
  },
};

// Mock featured posts for other creators
const MOCK_CREATOR_POSTS = {
  'user-elena-001': [
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400',
    'https://images.unsplash.com/photo-1620207418302-439b387441b0?w=400',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
  ],
  'user-marcus-003': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
    'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400',
  ],
  'user-sylvia-004': [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
    'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=400',
    'https://images.unsplash.com/photo-1573511860302-28c524319d2a?w=400',
  ],
};

// ─── Follow state helpers (localStorage mock) ────────────────────────────
const FOLLOWS_KEY = 'aura_mock_follows';
function getFollows() {
  try { return JSON.parse(localStorage.getItem(FOLLOWS_KEY)) || []; } catch { return []; }
}
function saveFollows(arr) { localStorage.setItem(FOLLOWS_KEY, JSON.stringify(arr)); }

function isFollowing(followerId, targetId) {
  return getFollows().some(f => f.followerId === followerId && f.targetId === targetId);
}
function toggleFollow(followerId, targetId) {
  const follows = getFollows();
  const idx = follows.findIndex(f => f.followerId === followerId && f.targetId === targetId);
  if (idx >= 0) {
    follows.splice(idx, 1);
    saveFollows(follows);
    return false;
  } else {
    follows.push({ followerId, targetId, createdAt: new Date().toISOString() });
    saveFollows(follows);
    return true;
  }
}

// ─── Component ───────────────────────────────────────────────────────────
export function ProfileView({ currentUser, viewingUserId, userPosts, onDeletePost, onMessageUser, onBack }) {
  const [isPrivate, setIsPrivate] = useState(currentUser?.is_private || false);
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [localFollowerCount, setLocalFollowerCount] = useState(0);

  // Determine whether we are viewing someone else's profile
  const isOwnProfile = !viewingUserId || viewingUserId === currentUser?.id;

  // The profile data to display
  const profileData = isOwnProfile
    ? currentUser
    : (MOCK_CREATOR_PROFILES[viewingUserId] || null);

  const creatorPosts = isOwnProfile
    ? userPosts
    : (MOCK_CREATOR_POSTS[viewingUserId] || []);

  // On mount / viewingUserId change — sync follow state
  useEffect(() => {
    if (!isOwnProfile && currentUser && viewingUserId) {
      const followed = isFollowing(currentUser.id, viewingUserId);
      setFollowing(followed);
      setLocalFollowerCount(profileData?.followers ?? 0);
    }
  }, [viewingUserId, currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Seed the creator as auto-followable by default: show Elena's profile as
  // pre-loaded for new users who haven't yet followed anyone.
  const handleFollow = () => {
    if (!currentUser) return;
    const nowFollowing = toggleFollow(currentUser.id, viewingUserId);
    setFollowing(nowFollowing);
    setLocalFollowerCount(c => nowFollowing ? c + 1 : Math.max(0, c - 1));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ─── PUBLIC profile view (another creator) ──────────────────────────────
  if (!isOwnProfile) {
    if (!profileData) {
      return (
        <div className="glass-card p-10 rounded-3xl text-center text-slate-400 text-sm">
          Profile not found.
          {onBack && (
            <button onClick={onBack} className="mt-4 block mx-auto text-purple-400 hover:text-purple-300 text-xs font-semibold">
              ← Go back
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 font-semibold transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
        )}

        {/* Profile Header Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={profileData.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'}
                alt={profileData.display_name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-purple-500/40 shadow-xl"
              />
              {/* Verified badge */}
              <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white p-1 rounded-full border-2 border-slate-950">
                <Sparkles className="w-3 h-3" />
              </div>
            </div>

            {/* Meta */}
            <div className="flex-1 space-y-3 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{profileData.display_name}</h2>
                  <span className="text-xs text-purple-400 font-mono">@{profileData.username}</span>
                  <div className="mt-1.5 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full text-[11px] font-bold">
                      {profileData.tier}
                    </span>
                    <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full text-[11px] font-bold">
                      {profileData.auraScore} AS
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-[11px]">
                      {profileData.gender === 'female' ? '♀ Aura Queen' : '♂ Aura King'}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleFollow}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      following
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-rose-900/30 hover:border-rose-500/40 hover:text-rose-400'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 border-transparent text-white hover:from-purple-500 hover:to-pink-500 shadow-md shadow-purple-500/20'
                    }`}
                  >
                    {following ? (
                      <><UserCheck className="w-3.5 h-3.5" /> Following</>
                    ) : (
                      <><UserPlus className="w-3.5 h-3.5" /> Follow</>
                    )}
                  </button>

                  {onMessageUser && currentUser && (
                    <button
                      onClick={() => onMessageUser(profileData.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Message
                    </button>
                  )}
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                {profileData.bio}
              </p>

              {/* Stats Row */}
              <div className="flex items-center justify-center sm:justify-start gap-6 pt-1">
                <div className="text-center">
                  <div className="text-base font-black text-white">{profileData.postsCount}</div>
                  <div className="text-[11px] text-slate-400">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-black text-white">{localFollowerCount.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-400">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-black text-white">{profileData.following}</div>
                  <div className="text-[11px] text-slate-400">Following</div>
                </div>
              </div>
            </div>
          </div>

          {/* Join date row */}
          <div className="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-800/80 pt-4">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            Member since {profileData.joinedDate}
            <span className="mx-1">•</span>
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            Public Profile
          </div>
        </div>

        {/* Posts Grid */}
        <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-300">
            <Grid3x3 className="w-4 h-4 text-purple-400" />
            Featured Works
          </div>

          {creatorPosts.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No public posts yet.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 bg-slate-800/40">
              {(Array.isArray(creatorPosts) && typeof creatorPosts[0] === 'string'
                ? creatorPosts
                : creatorPosts.map(p => p.media?.[0]?.url).filter(Boolean)
              ).map((url, i) => (
                <div key={i} className="aspect-square overflow-hidden bg-slate-900 group cursor-pointer">
                  <img
                    src={url}
                    alt={`Post ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── OWN profile / settings view ───────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'}
            alt={currentUser?.display_name}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-500/30 shadow-xl"
          />

          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-white">{currentUser?.display_name}</h2>
                <span className="text-xs text-purple-300 font-mono">@{currentUser?.username}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                <span className="inline-block px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full text-xs font-semibold">
                  Tier: {currentUser?.tier || 'Artisan'}
                </span>
                {currentUser?.gender && (
                  <span className="inline-block px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs">
                    {currentUser.gender === 'female' ? '♀ Aura Queen' : currentUser.gender === 'male' ? '♂ Aura King' : '✦ Creator'}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-xl">
              {currentUser?.bio || 'Digital creator testing AURA beta.'}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                Beta Member since Nov 2026
              </span>
              <span className="flex items-center gap-1.5">
                {isPrivate ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Globe className="w-3.5 h-3.5 text-emerald-400" />}
                {isPrivate ? 'Private Profile' : 'Public Profile'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings / Privacy Controls */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          Profile &amp; Privacy Controls
        </h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bio</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Private Account</span>
              <span className="text-[11px] text-slate-400">Only approved followers can view your posts and media.</span>
            </div>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 accent-purple-500 cursor-pointer"
            />
          </div>

          <Button type="submit" variant={saved ? 'outline' : 'primary'} size="sm">
            {saved ? '✓ Saved!' : 'Save Changes'}
          </Button>
        </form>
      </div>

      {/* My Posts Grid */}
      {userPosts && userPosts.length > 0 && (
        <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-300">
            <Grid3x3 className="w-4 h-4 text-purple-400" />
            My Posts ({userPosts.length})
          </div>
          <div className="grid grid-cols-3 gap-0.5 bg-slate-800/40">
            {userPosts.map((post) => {
              const imgUrl = post.media?.[0]?.url || post.thumbnailUrl;
              return imgUrl ? (
                <div key={post.id} className="aspect-square overflow-hidden bg-slate-900 group cursor-pointer">
                  <img
                    src={imgUrl}
                    alt={post.caption || 'Post'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div key={post.id} className="aspect-square bg-slate-900 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-slate-700" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
