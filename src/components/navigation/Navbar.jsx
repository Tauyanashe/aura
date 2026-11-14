import React from 'react';
import { Sparkles, Shield, PlusCircle, Coins, LogOut, UserCheck } from 'lucide-react';
import { Button } from '../common/Button';

export function Navbar({ currentUser, onOpenCreatePost, activeTab, setActiveTab, onSwitchDemo, onLogout }) {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('feed')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 p-0.5 shadow-lg shadow-purple-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white">AURA</span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md">
                Beta
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Farm-Backed Social Platform</p>
          </div>
        </div>

        {/* Stats & Quick Actions */}
        <div className="flex items-center gap-3">
          {/* AP & Score Pills */}
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2">
              <div
                onClick={() => setActiveTab('wallet')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:border-purple-500/50 transition"
                title="Aura Points Balance"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-300">{currentUser.balance || 0} AP</span>
              </div>

              <div
                onClick={() => setActiveTab('score')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 cursor-pointer hover:border-purple-500/50 transition"
                title="Aura Score Reputation"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-purple-300">{currentUser.auraScore || 100} AS</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 rounded text-purple-200">
                  {currentUser.tier || 'Novice'}
                </span>
              </div>
            </div>
          )}

          {/* Create Post Button */}
          <Button
            size="sm"
            icon={PlusCircle}
            onClick={onOpenCreatePost}
            className="shadow-md"
          >
            New Post
          </Button>

          {/* Account Demo Switcher */}
          <div className="hidden md:flex items-center gap-1 border-l border-slate-800 pl-3">
            <button
              onClick={() => onSwitchDemo(currentUser?.role === 'admin' ? 'elena@aura.network' : 'moderator@aura.network')}
              className="text-xs text-slate-400 hover:text-purple-300 px-2 py-1 rounded bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 flex items-center gap-1.5"
              title="Toggle between regular tester and admin view"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Role: <strong className="text-purple-400 uppercase">{currentUser?.role || 'user'}</strong></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
