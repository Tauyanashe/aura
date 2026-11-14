import React, { useState } from 'react';
import { User, Lock, Globe, Shield, Calendar } from 'lucide-react';
import { Button } from '../../components/common/Button';

export function ProfileView({ currentUser, userPosts, onDeletePost }) {
  const [isPrivate, setIsPrivate] = useState(currentUser?.is_private || false);
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
              <span className="inline-block px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full text-xs font-semibold">
                Tier: {currentUser?.tier || 'Artisan'}
              </span>
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
      <div className="glass-card p-6">
        <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          Profile & Privacy Controls
        </h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bio</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
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

          <div className="flex justify-end items-center gap-3 pt-2">
            {saved && <span className="text-xs text-emerald-400">Settings updated!</span>}
            <Button size="sm" type="submit">Save Changes</Button>
          </div>
        </form>
      </div>

      {/* Published Content Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-100">Your Published Posts ({userPosts.length})</h3>

        {userPosts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 glass-card">
            No published posts yet. Click "New Post" to use your monthly farm quota!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {userPosts.map((post) => (
              <div key={post.id} className="glass-card overflow-hidden group relative">
                <div className="aspect-square bg-slate-950 overflow-hidden">
                  <img
                    src={post.mediaAsset?.url || post.mediaAsset?.dataUrl || 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600'}
                    alt="Post"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-3 text-xs">
                  <p className="line-clamp-2 text-slate-200">{post.caption}</p>
                  <div className="flex justify-between items-center mt-2 text-[11px] text-slate-400">
                    <span>★ {post.ratingAverage || '0.0'} ({post.ratingsCount})</span>
                    <span>♥ {post.likesCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
