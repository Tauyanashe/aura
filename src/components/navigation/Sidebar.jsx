import React from 'react';
import { Home, Layers, Coins, Sparkles, Trophy, ShieldAlert, User, Database } from 'lucide-react';
import clsx from 'clsx';

export function Sidebar({ activeTab, setActiveTab, currentUser, farmStatus }) {
  const navItems = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'farms', label: 'Virtual Farms', icon: Layers, badge: `${farmStatus?.postsRemaining ?? 3} left` },
    { id: 'wallet', label: 'AP Wallet', icon: Coins },
    { id: 'score', label: 'Aura Score', icon: Sparkles },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  if (currentUser?.role === 'admin' || currentUser?.role === 'moderator') {
    navItems.push({ id: 'moderation', label: 'Moderation', icon: ShieldAlert, alert: true });
  }

  return (
    <aside className="w-64 flex-shrink-0 hidden md:block">
      <div className="sticky top-20 space-y-6">
        {/* Navigation Links */}
        <nav className="glass-panel rounded-2xl p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={clsx(
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/20 text-white border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={clsx('w-4 h-4', isActive ? 'text-purple-400' : 'text-slate-400')} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 font-semibold border border-purple-500/20">
                    {item.badge}
                  </span>
                )}
                {item.alert && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Live Farm Storage Widget */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-purple-400" />
              Drive Capacity
            </span>
            <span className="text-purple-300 font-bold">{farmStatus?.storageUsagePercent || 0}%</span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, farmStatus?.storageUsagePercent || 0)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>Monthly Posts</span>
            <span className="font-semibold text-slate-200">
              {farmStatus?.postsUsed ?? 0} / {farmStatus?.postsLimit ?? 3} used
            </span>
          </div>
        </div>

        {/* Beta Notice */}
        <div className="p-3 text-[11px] text-slate-400 text-center border border-slate-800/50 rounded-xl">
          Google Drive Beta Storage Adapter active. Zero budget testing tier.
        </div>
      </div>
    </aside>
  );
}
