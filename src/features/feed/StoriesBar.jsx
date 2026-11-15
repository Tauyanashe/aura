import React, { useState, useEffect } from 'react';
import { Plus, X, Heart, Send, Sparkles } from 'lucide-react';

const MOCK_STORIES = [
  {
    id: 's-elena',
    username: 'elena_v',
    displayName: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080',
    caption: 'Synthesizer patch testing in the studio 🎹✨',
    timeAgo: '2h ago',
    unseen: true,
  },
  {
    id: 's-sylvia',
    username: 'sylvia_art',
    displayName: 'Sylvia Chen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    mediaUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1080',
    caption: 'Tokyo rain reflections through 35mm lens 🌧️',
    timeAgo: '4h ago',
    unseen: true,
  },
  {
    id: 's-marcus',
    username: 'marcus_k',
    displayName: 'Marcus Thorne',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080',
    caption: 'Procedural 3D fluid simulations render complete!',
    timeAgo: '7h ago',
    unseen: false,
  },
  {
    id: 's-tapiwa',
    username: 'tapiwa_dev',
    displayName: 'Tapiwa Moyo',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    mediaUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080',
    caption: 'Satellite telemetry visualization pipeline 🛰️',
    timeAgo: '11h ago',
    unseen: false,
  },
];

export function StoriesBar({ currentUser, onOpenCreatePost }) {
  const [activeStory, setActiveStory] = useState(null);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [hasLikedStory, setHasLikedStory] = useState(false);

  useEffect(() => {
    if (!activeStory) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next story or close
          const currentIdx = MOCK_STORIES.findIndex((s) => s.id === activeStory.id);
          if (currentIdx < MOCK_STORIES.length - 1) {
            setActiveStory(MOCK_STORIES[currentIdx + 1]);
            return 0;
          } else {
            setActiveStory(null);
            return 0;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStory]);

  return (
    <>
      {/* Horizontal Scrolling Stories Strip */}
      <div className="glass-card p-2.5 sm:p-3 overflow-hidden">
        <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar scroll-smooth py-1 touch-pan-x overscroll-contain">
          {/* User's Add Story Bubble */}
          <div
            onClick={onOpenCreatePost}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
          >
            <div className="relative">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                alt="My Story"
                className="w-14 h-14 rounded-full object-cover p-0.5 border border-slate-700/80 group-hover:scale-105 transition-transform"
              />
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center border-2 border-slate-950 text-white shadow-md">
                <Plus className="w-3 h-3 stroke-[3]" />
              </div>
            </div>
            <span className="text-[10px] text-slate-300 font-medium">Your Story</span>
          </div>

          {/* Peer Creator Stories */}
          {MOCK_STORIES.map((story) => (
            <button
              key={story.id}
              onClick={() => {
                setActiveStory(story);
                setProgress(0);
                setHasLikedStory(false);
              }}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none"
            >
              <div
                className={`w-14 h-14 rounded-full p-0.5 transition-transform duration-200 group-hover:scale-105 ${
                  story.unseen
                    ? 'bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 shadow-sm shadow-purple-500/20'
                    : 'bg-slate-700'
                }`}
              >
                <img
                  src={story.avatar}
                  alt={story.displayName}
                  className="w-full h-full rounded-full object-cover border-2 border-slate-950"
                />
              </div>
              <span className="text-[10px] text-slate-300 font-medium max-w-[60px] truncate">
                {story.username}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Full-Screen Immersive Story Viewer */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm h-full max-h-[85vh] sm:rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-2xl">
            {/* Top Progress Bars */}
            <div className="absolute top-0 inset-x-0 z-20 p-3 space-y-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
              <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-400 to-pink-400 h-full transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Story Creator Header */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <img
                    src={activeStory.avatar}
                    alt={activeStory.displayName}
                    className="w-8 h-8 rounded-full object-cover border border-purple-500"
                  />
                  <div>
                    <span className="text-xs font-bold block">{activeStory.displayName}</span>
                    <span className="text-[10px] text-slate-300">{activeStory.timeAgo}</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveStory(null)}
                  className="p-1.5 rounded-full bg-black/40 hover:bg-black/80 text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Media Image */}
            <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={activeStory.mediaUrl}
                alt="Story media"
                className="w-full h-full object-cover"
              />

              {/* Tap Left / Right Navigation Zones */}
              <div
                className="absolute inset-y-0 left-0 w-1/3 cursor-pointer z-10"
                onClick={() => {
                  const currentIdx = MOCK_STORIES.findIndex((s) => s.id === activeStory.id);
                  if (currentIdx > 0) {
                    setActiveStory(MOCK_STORIES[currentIdx - 1]);
                    setProgress(0);
                  }
                }}
              />
              <div
                className="absolute inset-y-0 right-0 w-1/3 cursor-pointer z-10"
                onClick={() => {
                  const currentIdx = MOCK_STORIES.findIndex((s) => s.id === activeStory.id);
                  if (currentIdx < MOCK_STORIES.length - 1) {
                    setActiveStory(MOCK_STORIES[currentIdx + 1]);
                    setProgress(0);
                  } else {
                    setActiveStory(null);
                  }
                }}
              />
            </div>

            {/* Bottom Story Controls & Reply */}
            <div className="relative z-20 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent space-y-3">
              {activeStory.caption && (
                <p className="text-xs text-white/90 font-medium px-1 leading-snug">
                  {activeStory.caption}
                </p>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Reply to @${activeStory.username}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                />
                <button
                  onClick={() => setHasLikedStory(!hasLikedStory)}
                  className={`p-2 rounded-full transition ${
                    hasLikedStory ? 'text-pink-500 scale-125' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${hasLikedStory ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    if (replyText.trim()) {
                      alert(`Reply sent to @${activeStory.username}!`);
                      setReplyText('');
                    }
                  }}
                  className="p-2 rounded-full bg-purple-600 text-white hover:bg-purple-500 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
