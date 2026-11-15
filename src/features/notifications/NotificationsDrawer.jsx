import React, { useState } from 'react';
import { Bell, Heart, Star, MessageSquare, AlertCircle, CheckCheck, X, Sparkles } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';

// No hardcoded test notifications — real alerts only
const INITIAL_NOTIFICATIONS = [];

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
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md glass-panel border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-purple-400" />
                <h2 className="font-black text-white text-lg tracking-tight">Notifications</h2>
                {notifications.some(n => !n.isRead) && (
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 pt-4 pb-2">
              {['all', 'unread', 'ratings'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition ${
                    filter === f
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="mt-3 space-y-2.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <Sparkles className="w-8 h-8 text-purple-400/50 mx-auto" />
                  <p className="text-sm font-semibold text-slate-200">You're all caught up!</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Community ratings, peer comments, and direct message notifications will appear here.
                  </p>
                </div>
              ) : (
                filtered.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      item.isRead
                        ? 'bg-slate-900/40 border-slate-800/50'
                        : 'bg-purple-950/20 border-purple-500/30 shadow-sm shadow-purple-500/10'
                    }`}
                  >
                    <Avatar
                      src={item.actorAvatar}
                      displayName={item.actorName}
                      username={item.actorUsername}
                      size="sm"
                      ring="ring-purple-500/30"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white truncate">
                          {item.actorName}
                        </span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {item.timeAgo}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          {notifications.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
