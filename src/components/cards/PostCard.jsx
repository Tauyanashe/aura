import React, { useState } from 'react';
import { Heart, Star, MessageCircle, MoreVertical, Trash2, Flag, ShieldCheck } from 'lucide-react';
import { mediaService } from '../../services/media.service';

export function PostCard({
  post,
  currentUserId,
  onLike,
  onRate,
  onComment,
  onDelete,
  onReport,
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwner = post.userId === currentUserId;
  const mediaUrl = post.mediaAsset ? mediaService.getMediaUrl(post.mediaAsset) : '';

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
    <article className="glass-card overflow-hidden border border-slate-800/80 transition-all hover:border-slate-700/80">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={post.author?.displayName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-100">{post.author?.displayName}</span>
              <span className="text-xs text-slate-400">@{post.author?.username}</span>
              {post.author?.tier && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                  {post.author.tier}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">
              {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-36 glass-panel rounded-xl shadow-xl py-1 z-20 border border-slate-700">
              {isOwner ? (
                <button
                  onClick={() => { setMenuOpen(false); onDelete(post.id); }}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Post
                </button>
              ) : (
                <button
                  onClick={() => { setMenuOpen(false); onReport(post); }}
                  className="w-full text-left px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10 flex items-center gap-2"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Report Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-3">
          <p className="text-sm text-slate-200 leading-relaxed">{post.caption}</p>
        </div>
      )}

      {/* Media Content */}
      {mediaUrl && (
        <div className="relative bg-slate-950 aspect-video flex items-center justify-center overflow-hidden">
          {post.mediaAsset?.mimeType?.startsWith('video') ? (
            <video
              src={mediaUrl}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Post media"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur text-[10px] text-slate-300 font-mono">
            Drive Beta ID: {post.mediaAsset?.drive_file_id || 'stream'}
          </div>
        </div>
      )}

      {/* Interactions Bar */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 text-xs font-medium transition ${
                post.hasLiked ? 'text-pink-500' : 'text-slate-400 hover:text-pink-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${post.hasLiked ? 'fill-current' : ''}`} />
              <span>{post.likesCount || 0}</span>
            </button>

            {/* Comment Toggle */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-purple-400 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{post.commentsCount || 0}</span>
            </button>
          </div>

          {/* Interactive Rating Component (1-5 stars) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRate(star)}
                  disabled={isOwner}
                  className={`p-0.5 transition ${isOwner ? 'cursor-not-allowed opacity-70' : 'hover:scale-125'}`}
                  title={isOwner ? 'You cannot rate your own post' : `Rate ${star} star`}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      (hoverRating || post.userRating || Math.round(post.ratingAverage || 0)) >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-300">
              {post.ratingAverage ? Number(post.ratingAverage).toFixed(1) : 'New'}
            </span>
            <span className="text-[10px] text-slate-400">({post.ratingsCount || 0})</span>
          </div>
        </div>

        {/* Expandable Comments Drawer */}
        {showComments && (
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(post.comments || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No comments yet. Start the conversation!</p>
              ) : (
                post.comments.map((c) => (
                  <div key={c.id} className="text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-300 mr-2">@{c.username}:</span>
                    <span className="text-slate-300">{c.body}</span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a constructive comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium"
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
