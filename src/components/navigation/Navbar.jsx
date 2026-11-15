import React from 'react';
import { Sparkles, Coins, PlusCircle, Bell, Search, BarChart3, Bookmark, UserCheck, Shield, LogOut } from 'lucide-react';
import { Button } from '../common/Button';
import { AuraLogo } from '../common/AuraLogo';
import { Avatar } from '../common/Avatar';

export function Navbar({
  currentUser,
  onOpenCreatePost,
  activeTab,
  setActiveTab,
  onOpenNotifications,
  onLogout,
  unreadNotificationsCount = 2,
}) {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 safe-area-top">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-shrink-0" onClick={() => setActiveTab('feed')}>
          <AuraLogo size="md" />
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

          {/* User Account & Sign Out */}
          {currentUser && (
            <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-800 pl-2">
              <button
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition group"
                title="View your profile"
              >
                <Avatar
                  src={currentUser.avatar}
                  userId={currentUser.id}
                  displayName={currentUser.display_name}
                  username={currentUser.username}
                  size="xs"
                  ring="ring-purple-500/30 group-hover:ring-purple-400"
                />
                <span className="hidden sm:inline text-xs font-semibold text-slate-200 group-hover:text-purple-300 transition truncate max-w-[100px]">
                  {currentUser.display_name || currentUser.username}
                </span>
                {currentUser.role && currentUser.role !== 'user' && (
                  <span className="hidden md:inline text-[9px] uppercase font-black px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                    {currentUser.role}
                  </span>
                )}
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-slate-400 hover:text-rose-400 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 flex items-center justify-center transition"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
