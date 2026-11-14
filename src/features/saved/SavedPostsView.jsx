import React from 'react';
import { Bookmark, Sparkles, ExternalLink } from 'lucide-react';
import { PostCard } from '../../components/cards/PostCard';

export function SavedPostsView({ savedPostIds, allPosts, currentUserId, onLike, onRate, onComment, onShare, onBookmark }) {
  const savedPosts = allPosts.filter(p => savedPostIds.has(p.id));

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-purple-400 fill-purple-400" />
            Saved Collections & Inspirations
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Private bookmarks saved from creator feeds. Accessible only by you.
          </p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
          {savedPosts.length} saved
        </span>
      </div>

      {savedPosts.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 glass-card space-y-2">
          <Bookmark className="w-8 h-8 mx-auto text-slate-600" />
          <p className="font-semibold text-slate-300">No saved posts yet</p>
          <p>Tap the bookmark icon on any post in the feed to save it for reference.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {savedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onLike={onLike}
              onRate={onRate}
              onComment={onComment}
              onShare={onShare}
              onBookmark={onBookmark}
              isBookmarked={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
