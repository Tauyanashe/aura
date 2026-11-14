import React, { useState } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, Database, Sparkles, Sliders, Check } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { mediaService } from '../../services/media.service';

const ASPECT_RATIOS = [
  { id: 'aspect-square', label: '1:1 Square', ratio: '1:1' },
  { id: 'aspect-[4/5]', label: '4:5 Portrait', ratio: '4:5' },
  { id: 'aspect-video', label: '16:9 Cinema', ratio: '16:9' },
];

const FILTER_PRESETS = [
  { id: 'none', label: 'Original', filterStyle: '' },
  { id: 'cyberpunk', label: 'Cyberpunk', filterStyle: 'hue-rotate(290deg) contrast(115%) saturate(130%)' },
  { id: 'golden', label: 'Golden Hour', filterStyle: 'sepia(30%) contrast(105%) brightness(105%)' },
  { id: 'emerald', label: 'Emerald', filterStyle: 'hue-rotate(90deg) saturate(120%)' },
  { id: 'noir', label: 'Noir B&W', filterStyle: 'grayscale(100%) contrast(125%)' },
];

const SUGGESTED_HASHTAGS = [
  '#digitalart',
  '#photography',
  '#cyberpunk',
  '#soundscapes',
  '#procedural',
  '#3drender',
];

export function CreatePostModal({ isOpen, onClose, onPublish, farmStatus, currentUser }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [aspectRatio, setAspectRatio] = useState('aspect-video');
  const [activeFilter, setActiveFilter] = useState('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          ).toFixed(1)} MB). Upgrade your farm capacity.`
        );
        return;
      }

      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreview(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const addTag = (tag) => {
    if (!caption.includes(tag)) {
      setCaption((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image or video to post.');
      return;
    }

    if (farmStatus && farmStatus.postsRemaining <= 0) {
      setError('Monthly post allowance exhausted. Acquire an additional farm or wait for next month cycle.');
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

      setFile(null);
      setPreview(null);
      setCaption('');
      setActiveFilter('none');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  const selectedFilterStyle = FILTER_PRESETS.find((f) => f.id === activeFilter)?.filterStyle || '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Post" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Farm Quota Telemetry Banner */}
        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-4 h-4 text-purple-400" />
            <span className="font-medium">Farm Infrastructure:</span>
          </div>
          <div className="flex items-center gap-3 font-semibold text-[11px]">
            <span className={farmStatus?.postsRemaining > 0 ? 'text-emerald-400' : 'text-red-400'}>
              {farmStatus?.postsRemaining ?? 3} posts remaining
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-purple-300">
              {((farmStatus?.storageRemainingBytes || 250000000) / 1024 / 1024).toFixed(0)} MB storage free
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Media Preview & Canvas with Filters */}
        <div className="relative border-2 border-dashed border-slate-700/80 hover:border-purple-500/60 rounded-2xl overflow-hidden bg-slate-950 text-center transition">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          {preview ? (
            <div className={`relative ${aspectRatio} w-full overflow-hidden bg-black flex items-center justify-center`}>
              {file?.type?.startsWith('video') ? (
                <video src={preview} className="w-full h-full object-contain" controls />
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover transition-all duration-200"
                  style={{ filter: selectedFilterStyle }}
                />
              )}

              {/* File details badge */}
              <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur text-[10px] text-slate-300 font-mono border border-white/10">
                {(file.size / 1024 / 1024).toFixed(1)} MB • {file.type.split('/')[1].toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="py-10 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-200">
                Tap or drag media to upload
              </div>
              <p className="text-xs text-slate-400">
                High quality JPEG, PNG, WebP, GIF, or MP4 (up to 25 MB)
              </p>
            </div>
          )}
        </div>

        {/* Professional Creative Controls (Aspect Ratio & Filters) */}
        {preview && (
          <div className="space-y-3 p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
            {/* Aspect Ratio */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Aspect Ratio</span>
              <div className="flex gap-1.5">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setAspectRatio(r.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition ${
                      aspectRatio === r.id
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r.ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Presets */}
            {!file?.type?.startsWith('video') && (
              <div className="space-y-1.5">
                <span className="text-slate-400 font-medium text-xs block">Visual Tone Preset</span>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {FILTER_PRESETS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] whitespace-nowrap font-medium transition ${
                        activeFilter === f.id
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Caption & Hashtag Builder */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Caption & Context
          </label>
          <textarea
            rows={3}
            placeholder="Describe technical context, composition, prompt, or aesthetic thoughts..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500"
            maxLength={2200}
          />

          {/* Quick Hashtags */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {SUGGESTED_HASHTAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-purple-300 hover:bg-purple-600/20 border border-slate-700/60 transition"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Audience Visibility */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Audience Visibility
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'public', label: 'Public (Everyone)' },
              { id: 'followers', label: 'Followers Only' },
              { id: 'private', label: 'Private (Archive)' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVisibility(v.id)}
                className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition ${
                  visibility === v.id
                    ? 'bg-purple-600/20 text-purple-300 border-purple-500 font-semibold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            loading={loading}
            disabled={!file || (farmStatus && farmStatus.postsRemaining <= 0)}
          >
            Publish Post (+25 AP)
          </Button>
        </div>
      </form>
    </Modal>
  );
}
