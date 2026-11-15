import React, { useState } from 'react';
import { Search, Sparkles, TrendingUp, Filter, Heart, Star, Tag } from 'lucide-react';

const TOPIC_TAGS = [
  'All',
  '🔥 Trending',
  '🎨 Digital Art',
  '📸 Photography',
  '🎹 Soundscapes',
  '🤖 Procedural',
  '🌱 Farm Updates',
];

// Dynamic explore items — populated by published posts
const EXPLORE_ITEMS = [];

export function ExploreView({ onSelectPost }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const filteredItems = EXPLORE_ITEMS.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag =
      selectedTag === 'All' ||
      selectedTag.toLowerCase().includes(item.tag.toLowerCase());

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search creators, hashtags (#art), soundscapes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-inner"
        />
      </div>

      {/* Topics / Tags Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {TOPIC_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedTag === tag
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-semibold'
                : 'bg-slate-900/70 border border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Grid of Discovered Media */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center text-slate-400 glass-card rounded-2xl border border-slate-800 space-y-3">
          <Sparkles className="w-8 h-8 text-purple-400/50 mx-auto" />
          <p className="text-sm font-semibold text-slate-200">No media discovered yet</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            New community creations and viral media will appear here as users publish.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectPost && onSelectPost(item)}
              className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer shadow-md hover:border-purple-500/50 transition-all duration-300"
            >
              <div className={`${item.aspect} w-full overflow-hidden`}>
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>

              {/* Gradient Overlay with Metrics */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white">
                <span className="text-xs font-bold leading-tight drop-shadow truncate block">
                  {item.title}
                </span>
                <span className="text-[10px] text-purple-300 drop-shadow">@{item.author}</span>

                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/20 mt-1.5">
                  <span className="flex items-center gap-1 text-amber-300 font-bold">
                    <Star className="w-3 h-3 fill-amber-300" />
                    {item.rating}
                  </span>
                  <span className="flex items-center gap-1 text-pink-300 font-medium">
                    <Heart className="w-3 h-3 fill-pink-300" />
                    {item.likes}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
