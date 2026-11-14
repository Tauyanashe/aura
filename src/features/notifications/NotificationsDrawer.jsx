import React, { useState } from 'react';
import { Bell, Heart, Star, MessageSquare, AlertCircle, CheckCheck, X } from 'lucide-react';
import { Button } from '../../components/common/Button';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'n-1',
    type: 'rating',
    actorName: 'Marcus Thorne',
    actorUsername: 'marcus_k',
    actorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    text: 'rated your post "Neon luminescence" 5 stars (+10 AP awarded)',
    timeAgo: '15m ago',
    isRead: false,
  },
  {
    id: 'n-2',
    type: 'like',
    actorName: 'Sylvia Chen',
    actorUsername: 'sylvia_art',
    actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    text: 'liked your visual update (+2 AP)',
    timeAgo: '1h ago',
    isRead: false,
  },
  {
    id: 'n-3',
    type: 'farm_alert',
    actorName: 'AURA System',
    actorUsername: 'system',
    actorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
    text: 'Monthly farm cycle renewal verified. 3 fresh post slots available for November.',
    timeAgo: '1d ago',
    isRead: true,
  },
  {
    id: 'n-4',
    type: 'comment',
    actorName: 'Tapiwa Moyo',
    actorUsername: 'tapiwa_dev',
    actorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    text: 'commented: "The dynamic range on this shot is incredible." (+5 AP)',
    timeAgo: '2d ago',
    isRead: true,
  },
];

export function NotificationsDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState('all');

  if (!isOpen) return null;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'ratings') return n.type === 'rating';
    if (filter === 'farm') return n.type === 'farm_alert';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm glass-panel bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-slate-100">Notifications</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                {notifications.filter(n => !n.isRead).length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-slate-400 hover:text-purple-300 flex items-center gap-1 p-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Read all</span>
              </button>
              <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-2 border-b border-slate-800 flex gap-1 overflow-x-auto no-scrollbar">
            {['all', 'unread', 'ratings', 'farm'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[11px] capitalize whitespace-nowrap transition ${
                  filter === f
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No notifications in this filter.
              </div>
            ) : (
              filtered.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl transition flex items-start gap-3 ${
                    n.isRead ? 'opacity-70 hover:opacity-100' : 'bg-purple-500/5 border border-purple-500/10'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={n.actorAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-900">
                      {n.type === 'rating' ? (
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ) : n.type === 'like' ? (
                        <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
                      ) : n.type === 'farm_alert' ? (
                        <AlertCircle className="w-3 h-3 text-purple-400" />
                      ) : (
                        <MessageSquare className="w-3 h-3 text-blue-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 text-xs">
                    <p className="text-slate-200 leading-snug">
                      <strong className="text-white font-semibold">{n.actorName}</strong>{' '}
                      {n.text}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1">{n.timeAgo}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
