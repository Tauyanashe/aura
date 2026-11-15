import React, { useState, useEffect } from 'react';
import {
  User, Lock, Globe, Shield, Calendar, ArrowLeft,
  UserPlus, UserCheck, MessageSquare, Sparkles, Grid3x3, Heart
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';

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
export function ProfileView({ currentUser, viewingUserId, userPosts, onDeletePost, onMessageUser, onBack, onUserUpdate }) {
  const [isPrivate, setIsPrivate] = useState(currentUser?.is_private || false);
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [displayName, setDisplayName] = useState(currentUser?.display_name || '');
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [localFollowerCount, setLocalFollowerCount] = useState(0);
  const [localAvatar, setLocalAvatar] = useState(currentUser?.avatar || null);

  // Determine whether we are viewing someone else's profile
  const isOwnProfile = !viewingUserId || viewingUserId === currentUser?.id;

  // For other profiles, we'd fetch from API — for now show basic info
  const profileData = isOwnProfile ? currentUser : null;

  const creatorPosts = isOwnProfile ? userPosts : [];

  // On mount / viewingUserId change — sync follow state
  useEffect(() => {
    if (!isOwnProfile && currentUser && viewingUserId) {
      const followed = isFollowing(currentUser.id, viewingUserId);
      setFollowing(followed);
      setLocalFollowerCount(0);
    }
  }, [viewingUserId, currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFollow = () => {
    if (!currentUser) return;
    const nowFollowing = toggleFollow(currentUser.id, viewingUserId);
    setFollowing(nowFollowing);
    setLocalFollowerCount(c => nowFollowing ? c + 1 : Math.max(0, c - 1));
  };

  const handleAvatarChange = (dataUrl) => {
    setLocalAvatar(dataUrl);
    // Update the current user session with new avatar
    if (onUserUpdate) {
      onUserUpdate({ avatar: dataUrl });
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (onUserUpdate) {
      onUserUpdate({ bio, display_name: displayName, is_private: isPrivate });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ─── PUBLIC profile view (another user) ──────────────────────────────
  if (!isOwnProfile) {
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

        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex flex-col items-center text-center gap-4">
            <Avatar
              userId={viewingUserId}
              displayName="User"
              size="xl"
              ring="ring-purple-500/40"
            />
            <p className="text-sm text-slate-300">This profile will load once connected to the backend.</p>
            <div className="flex items-center gap-2">
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
                  onClick={() => onMessageUser(viewingUserId)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message
                </button>
              )}
            </div>
          </div>
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
          <Avatar
            src={localAvatar}
            userId={currentUser?.id}
            displayName={currentUser?.display_name}
            username={currentUser?.username}
            size="xl"
            editable={true}
            onAvatarChange={handleAvatarChange}
            ring="ring-purple-500/30"
          />

          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-white">{currentUser?.display_name}</h2>
                <span className="text-xs text-purple-300 font-mono">@{currentUser?.username}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                <span className="inline-block px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full text-xs font-semibold">
                  Tier: {currentUser?.tier || 'Novice'}
                </span>
                {currentUser?.gender && (
                  <span className="inline-block px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs">
                    {currentUser.gender === 'female' ? '♀ Aura Queen' : currentUser.gender === 'male' ? '♂ Aura King' : '✦ Creator'}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-xl">
              {currentUser?.bio || 'No bio yet. Add one below!'}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                Member since {new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

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
              const imgUrl = post.media?.[0]?.url || post.thumbnailUrl || post.mediaAsset?.url;
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
