import React from 'react';
import { Home, Compass, Plus, MessageSquare, User } from 'lucide-react';
import clsx from 'clsx';

export function MobileBottomNav({
  activeTab,
  setActiveTab,
  onOpenCreatePost,
  farmStatus,
  currentUser,
  unreadCount = 0,
  onOpenNotifications,
}) {
  const items = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    {
      id: 'create',
      label: 'Create',
      isPrimaryAction: true,
      onClick: onOpenCreatePost,
      postsRemaining: farmStatus?.postsRemaining ?? 3,
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      badge: unreadCount > 0 ? `${unreadCount}` : null,
    },
    {
      id: 'profile',
      label: 'You',
      icon: User,
      avatar: currentUser?.avatar,
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map((item) => {
          if (item.isPrimaryAction) {
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className="relative -top-4 flex flex-col items-center group focus:outline-none"
                aria-label="Create Post"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 p-0.5 shadow-xl shadow-purple-600/40 active:scale-95 transition-transform duration-150 flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center group-hover:bg-transparent transition-colors">
                    <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-purple-300 mt-1">
                  {item.postsRemaining} left
                </span>
              </button>
            );
          }

          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={clsx(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative',
                isActive ? 'text-purple-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <div className="relative">
                {item.avatar ? (
                  <img
                    src={item.avatar}
                    alt="Profile"
                    className={clsx(
                      'w-5 h-5 rounded-full object-cover transition-all',
                      isActive ? 'ring-2 ring-purple-500 scale-110' : 'opacity-80'
                    )}
                  />
                ) : (
                  <Icon className={clsx('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                )}

                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 bg-purple-600 text-white text-[9px] font-black rounded-full border border-slate-950">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-purple-400 mt-0.5 shadow-sm shadow-purple-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
