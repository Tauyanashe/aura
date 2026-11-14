import React from 'react';
import { Sparkles, Coins, PlusCircle, Bell, Search, BarChart3, Bookmark, UserCheck, Shield } from 'lucide-react';
import { Button } from '../common/Button';

export function Navbar({
  currentUser,
  onOpenCreatePost,
  activeTab,
  setActiveTab,
  onSwitchDemo,
  onOpenNotifications,
  unreadNotificationsCount = 2,
}) {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('feed')}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 p-0.5 shadow-lg shadow-purple-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-white">AURA</span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-extrabold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                Beta
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Farm-Backed Social Platform</p>
          </div>
        </div>

        {/* Center Desktop Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'feed' ? 'bg-purple-600/20 text-purple-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'explore' ? 'bg-purple-600/20 text-purple-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setActiveTab('farms')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'farms' ? 'bg-purple-600/20 text-purple-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Farms
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'analytics' ? 'bg-purple-600/20 text-purple-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'saved' ? 'bg-purple-600/20 text-purple-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Saved
          </button>
        </nav>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2.5">
          {/* AP Chips */}
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2">
              <div
                onClick={() => setActiveTab('wallet')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-amber-500/50 transition shadow-sm"
                title="Aura Points Balance"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">{currentUser.balance || 0} AP</span>
              </div>

              <div
                onClick={() => setActiveTab('score')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 cursor-pointer hover:border-purple-500/50 transition"
                title="Aura Score Reputation"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-bold text-purple-300">{currentUser.auraScore || 100} AS</span>
              </div>
            </div>
          )}

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            aria-label="Open notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-pink-500 ring-2 ring-slate-950 animate-pulse" />
            )}
          </button>

          {/* Create Post Button (Desktop) */}
          <Button
            size="sm"
            icon={PlusCircle}
            onClick={onOpenCreatePost}
            className="hidden sm:inline-flex shadow-lg shadow-purple-500/20"
          >
            New Post
          </Button>

          {/* Role Persona Switcher */}
          <div className="flex items-center border-l border-slate-800 pl-2">
            <button
              onClick={() =>
                onSwitchDemo(currentUser?.role === 'admin' ? 'elena@aura.network' : 'moderator@aura.network')
              }
              className="text-[11px] text-slate-400 hover:text-purple-300 px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5"
              title="Toggle between regular user and admin/moderator persona"
            >
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Role:</span>
              <strong className="text-purple-400 uppercase font-black">{currentUser?.role || 'user'}</strong>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
