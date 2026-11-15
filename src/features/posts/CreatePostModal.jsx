import React, { useState, useRef } from 'react';
import {
  Upload, Image as ImageIcon, AlertCircle, Sparkles, X, Check,
  Camera, Film, Hash, Globe, Lock, Users, Smile, ArrowLeft, Database, SlidersHorizontal
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Avatar } from '../../components/common/Avatar';
import { mediaService } from '../../services/media.service';

const ASPECT_RATIOS = [
  { id: 'aspect-square', label: '1:1', sublabel: 'Square (IG)' },
  { id: 'aspect-[4/5]', label: '4:5', sublabel: 'Portrait (Feed)' },
  { id: 'aspect-[9/16]', label: '9:16', sublabel: 'Reel / TikTok' },
  { id: 'aspect-video', label: '16:9', sublabel: 'Landscape' },
];

const FILTER_PRESETS = [
  { id: 'none', label: 'Normal', filterStyle: '' },
  { id: 'clarendon', label: 'Clarendon', filterStyle: 'contrast(120%) saturate(125%)' },
  { id: 'juno', label: 'Juno', filterStyle: 'contrast(115%) brightness(110%) saturate(140%) sepia(15%)' },
  { id: 'ludwig', label: 'Ludwig', filterStyle: 'brightness(105%) contrast(105%) saturate(110%)' },
  { id: 'cyberpunk', label: 'Cyberpunk', filterStyle: 'hue-rotate(290deg) contrast(120%) saturate(135%)' },
  { id: 'golden', label: 'Golden Hour', filterStyle: 'sepia(35%) contrast(110%) brightness(105%)' },
  { id: 'noir', label: 'B&W Film', filterStyle: 'grayscale(100%) contrast(130%)' },
];

const TRENDING_HASHTAGS = [
  '#aura', '#fyp', '#viral', '#photography', '#digitalart', '#creative', '#aesthetic', '#reels'
];

const EMOJIS = ['✨', '🔥', '📸', '⚡', '🖤', '👑', '💫', '🎨', '🚀', '💯'];

export function CreatePostModal({ isOpen, onClose, onPublish, farmStatus, currentUser }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [aspectRatio, setAspectRatio] = useState('aspect-square');
  const [activeFilter, setActiveFilter] = useState('none');
  const [step, setStep] = useState('upload'); // 'upload' | 'edit'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setError('');
    if (!selected) return;

    try {
      mediaService.validateFile(selected);

      if (farmStatus && selected.size > farmStatus.storageRemainingBytes) {
        setError(
          `File size (${(selected.size / 1024 / 1024).toFixed(1)} MB) exceeds remaining farm storage (${(
            farmStatus.storageRemainingBytes / 1024 / 1024
          ).toFixed(1)} MB).`
        );
        return;
      }

      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreview(url);
      setStep('edit');
    } catch (err) {
      setError(err.message);
    }
  };

  const addTag = (tag) => {
    if (!caption.includes(tag)) {
      setCaption((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  };

  const addEmoji = (emoji) => {
    setCaption((prev) => `${prev}${emoji}`);
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setCaption('');
    setActiveFilter('none');
    setStep('upload');
    setError('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!file) {
      setError('Please select a photo or video to post.');
      return;
    }

    if (farmStatus && farmStatus.postsRemaining <= 0) {
      setError('Monthly post allowance reached. Free farm renews next cycle.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const uploadRes = await mediaService.uploadMedia(file);

      await onPublish({
        caption,
        visibility,
        media: uploadRes,
      });

      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  const selectedFilterStyle = FILTER_PRESETS.find((f) => f.id === activeFilter)?.filterStyle || '';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl sm:max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92dvh]">
        
        {/* ─── Top Instagram-style Header ─── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2">
            {step === 'edit' ? (
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                title="Change media"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : null}
            <span className="font-black text-sm sm:text-base text-white tracking-tight">
              Create New Post
            </span>
          </div>

          <div className="flex items-center gap-2">
            {step === 'edit' && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !file}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white hover:opacity-90 transition disabled:opacity-50 shadow-md shadow-purple-500/20 flex items-center gap-1.5"
              >
                {loading ? (
                  <span>Sharing...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ─── Main Content ─── */}
        <div className="flex-1 overflow-y-auto">
          {step === 'upload' ? (
            /* Upload Screen (Drag & Drop or Camera/Gallery) */
            <div className="p-8 sm:p-14 flex flex-col items-center justify-center text-center space-y-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* TikTok / IG Style Media Selector Icon */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 p-0.5 shadow-2xl shadow-purple-600/30 cursor-pointer group hover:scale-105 transition-transform"
              >
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex flex-col items-center justify-center gap-2 group-hover:bg-slate-900/60 transition-colors">
                  <div className="flex items-center gap-1.5 text-purple-400">
                    <ImageIcon className="w-7 h-7" />
                    <Film className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                    Upload
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Drag photos and videos here
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Share high-resolution images or short video clips with the AURA community.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition active:scale-95 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Select from Device
                </button>
              </div>

              {/* Telemetry info */}
              <div className="pt-4 border-t border-slate-900 text-[11px] text-slate-500 flex items-center gap-3">
                <span>JPEG, PNG, WebP, GIF, MP4</span>
                <span>•</span>
                <span>Max 25 MB</span>
                <span>•</span>
                <span className="text-purple-400 font-semibold">+25 AP Reward</span>
              </div>
            </div>
          ) : (
            /* Edit Screen (IG-Style Split on Desktop, Stack on Mobile) */
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
              
              {/* Left Column: Media Canvas & Tools (Col 7) */}
              <div className="md:col-span-7 bg-black flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
                {/* Media Preview Container */}
                <div className="relative flex-1 flex items-center justify-center p-3 min-h-[300px] sm:min-h-[380px] overflow-hidden bg-slate-950">
                  <div className={`relative ${aspectRatio} w-full max-h-[440px] flex items-center justify-center rounded-xl overflow-hidden bg-slate-900`}>
                    {file?.type?.startsWith('video') ? (
                      <video src={preview} className="w-full h-full object-contain" controls autoPlay loop muted playsInline />
                    ) : (
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover transition-all duration-300"
                        style={{ filter: selectedFilterStyle }}
                      />
                    )}
                  </div>
                </div>

                {/* Aspect Ratio + Filter Bar */}
                <div className="p-3 bg-slate-900/90 border-t border-slate-800 space-y-2.5">
                  {/* Aspect Ratio Selector */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-slate-400">Aspect Ratio</span>
                    <div className="flex gap-1">
                      {ASPECT_RATIOS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setAspectRatio(r.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                            aspectRatio === r.id
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter Carousel (Instagram-style) */}
                  {!file?.type?.startsWith('video') && (
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                      {FILTER_PRESETS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setActiveFilter(f.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all ${
                            activeFilter === f.id
                              ? 'bg-purple-600 text-white ring-2 ring-purple-400/50'
                              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Caption, Hashtags, Audience (Col 5) */}
              <div className="md:col-span-5 p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-slate-950/60">
                <div className="space-y-4">
                  {/* Creator Bar */}
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      src={currentUser?.avatar}
                      userId={currentUser?.id}
                      displayName={currentUser?.display_name}
                      username={currentUser?.username}
                      size="sm"
                      ring="ring-purple-500/30"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {currentUser?.display_name || currentUser?.username || 'Creator'}
                      </span>
                      <span className="text-[10px] text-purple-400 font-mono">
                        @{currentUser?.username || 'user'}
                      </span>
                    </div>
                  </div>

                  {/* Caption Input */}
                  <div className="space-y-1.5">
                    <textarea
                      rows={4}
                      placeholder="Write a caption... (e.g. aesthetic, mood, behind-the-scenes)"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none leading-relaxed transition"
                      maxLength={2200}
                    />

                    {/* Emoji Bar */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      <Smile className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => addEmoji(e)}
                          className="text-xs hover:scale-125 transition-transform px-0.5"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hashtags Strip */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-purple-400" />
                      Trending Tags
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {TRENDING_HASHTAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addTag(tag)}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-purple-300 hover:bg-purple-600/20 hover:border-purple-500/30 transition"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audience Selector */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400">Audience</span>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      {[
                        { id: 'public', label: 'Public', icon: Globe },
                        { id: 'followers', label: 'Followers', icon: Users },
                        { id: 'private', label: 'Private', icon: Lock },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = visibility === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setVisibility(item.id)}
                            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1 font-semibold border transition ${
                              isSelected
                                ? 'bg-purple-600/20 text-purple-300 border-purple-500'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Share Button on Mobile */}
                <div className="pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !file}
                    className="w-full py-3 rounded-2xl font-bold text-xs bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white hover:opacity-95 transition disabled:opacity-50 shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>Publishing...</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Publish Post (+25 AP)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
