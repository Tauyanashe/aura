import React, { useState, useRef } from 'react';
import {
  Heart,
  Star,
  MessageCircle,
  MoreVertical,
  Trash2,
  Flag,
  Share2,
  Bookmark,
  Check,
  Sparkles,
  Info
} from 'lucide-react';
import { mediaService } from '../../services/media.service';

export function PostCard({
  post,
  currentUserId,
  onLike,
  onRate,
  onComment,
  onDelete,
  onReport,
  onShare,
  onBookmark,
  onViewProfile,
  isBookmarked = false,
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showRatingBreakdown, setShowRatingBreakdown] = useState(false);

  const lastTapRef = useRef(0);

  const isOwner = post.userId === currentUserId;
  const mediaUrl = post.mediaAsset ? mediaService.getMediaUrl(post.mediaAsset) : '';

  // Double-tap to like
  const handleMediaTouchOrClick = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (!post.hasLiked) {
        onLike(post.id);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    }
    lastTapRef.current = now;
  };

  const handleRate = (score) => {
    if (isOwner) {
      alert('Anti-Fraud Policy: You cannot rate your own post to earn AP.');
      return;
    }
    onRate(post.id, score);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(post.id, commentText);
    setCommentText('');
  };

  return (
    <article className="glass-card overflow-hidden border border-slate-800/80 transition-all hover:border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-xl shadow-black/20">
      {/* Post Author Bar */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onViewProfile && onViewProfile(post.userId)}
        >
          <div className="relative">
            <img
              src={post.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={post.author?.displayName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30 group-hover:ring-purple-400 p-0.5 bg-slate-900 transition"
            />
            {post.author?.tier === 'Legend' && (
              <span className="absolute -bottom-1 -right-1 text-[10px]">✨</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-purple-400 transition">
                {post.author?.displayName}
              </span>
              <span className="text-[11px] text-slate-400">@{post.author?.username}</span>
              {post.author?.tier && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold tracking-wide">
                  {post.author.tier}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {new Date(post.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Action Menu Toggle */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition"
            aria-label="Post actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-40 glass-panel rounded-2xl shadow-2xl py-1.5 z-30 border border-slate-700 animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  if (onShare) onShare(post);
                }}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2.5"
              >
                <Share2 className="w-3.5 h-3.5 text-purple-400" />
                Share Post
              </button>

              {isOwner ? (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(post.id);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Post
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onReport(post);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-amber-400 hover:bg-amber-500/10 flex items-center gap-2.5"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Report Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Caption */}
      {post.caption && (
        <div className="px-3.5 sm:px-4 pb-3">
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed break-words whitespace-pre-wrap">
            {post.caption}
          </p>
        </div>
      )}

      {/* Media Canvas with Double Tap Gesture */}
      {mediaUrl && (
        <div
          className="relative bg-slate-950 aspect-[4/3] sm:aspect-video flex items-center justify-center overflow-hidden cursor-pointer select-none"
          onClick={handleMediaTouchOrClick}
        >
          {post.mediaAsset?.mimeType?.startsWith('video') ? (
            <video
              src={mediaUrl}
              controls
              className="w-full h-full object-contain"
              playsInline
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Post visual"
              className="w-full h-full object-cover transition-transform duration-300"
              loading="lazy"
            />
          )}

          {/* Double-tap heart burst animation */}
          {showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="animate-in zoom-in-50 fade-in duration-200 text-pink-500 drop-shadow-2xl">
                <Heart className="w-24 h-24 fill-current drop-shadow-lg" />
              </div>
            </div>
          )}

          {/* Cloud Storage Tag */}
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] text-slate-300 font-mono border border-white/10 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Drive Safe ID</span>
          </div>
        </div>
      )}

      {/* Mobile-First Interactive Action Bar */}
      <div className="p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded-xl transition-all ${
                post.hasLiked
                  ? 'text-pink-500 bg-pink-500/10 scale-105'
                  : 'text-slate-400 hover:text-pink-400 hover:bg-slate-800/60'
              }`}
              aria-label="Like post"
            >
              <Heart className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${post.hasLiked ? 'fill-current' : ''}`} />
              <span>{post.likesCount || 0}</span>
            </button>

            {/* Comment Drawer Toggle */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-slate-800/60 transition"
              aria-label="Comments"
            >
              <MessageCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span>{post.commentsCount || 0}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={() => onShare && onShare(post)}
              className="flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-slate-800/60 transition"
              aria-label="Share post"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Right side: Bookmark & Interactive Star Rating */}
          <div className="flex items-center gap-2">
            {/* Bookmark button */}
            <button
              onClick={() => onBookmark && onBookmark(post.id)}
              className={`p-1.5 rounded-xl transition ${
                isBookmarked
                  ? 'text-purple-400 bg-purple-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Bookmark post"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            {/* 1-5 Star Ratings Component */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-800">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleRate(star)}
                    disabled={isOwner}
                    className={`p-0.5 transition ${
                      isOwner ? 'cursor-not-allowed opacity-60' : 'hover:scale-125'
                    }`}
                    title={isOwner ? 'Self-rating disabled' : `Rate ${star} star`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        (hoverRating || post.userRating || Math.round(post.ratingAverage || 0)) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <span
                onClick={() => setShowRatingBreakdown(!showRatingBreakdown)}
                className="text-xs font-bold text-amber-300 font-mono cursor-pointer hover:underline"
                title="View rating score details"
              >
                {post.ratingAverage ? Number(post.ratingAverage).toFixed(1) : 'New'}
              </span>
            </div>
          </div>
        </div>

        {/* Rating Breakdown Accordion */}
        {showRatingBreakdown && (
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Community Quality Score
              </span>
              <span className="text-amber-300">{post.ratingsCount || 0} reviews</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Normalized peer evaluation. Contributing a constructive rating rewards both you (+2 AP) and the creator.
            </p>
          </div>
        )}

        {/* Expandable Comments Drawer */}
        {showComments && (
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {(post.comments || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  No comments yet. Share your thoughts with the creator!
                </p>
              ) : (
                post.comments.map((c) => (
                  <div key={c.id} className="text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-purple-300">@{c.username}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-200">{c.body}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a constructive peer comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}
