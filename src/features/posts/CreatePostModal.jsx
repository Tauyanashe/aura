import React, { useState } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, Database, Check } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { mediaService } from '../../services/media.service';

export function CreatePostModal({ isOpen, onClose, onPublish, farmStatus, currentUser }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setError('');
    if (!selected) return;

    try {
      mediaService.validateFile(selected);

      // Check if file size exceeds remaining storage
      if (farmStatus && selected.size > farmStatus.storageRemainingBytes) {
        setError(`File size (${(selected.size / 1024 / 1024).toFixed(1)} MB) exceeds remaining farm storage (${(farmStatus.storageRemainingBytes / 1024 / 1024).toFixed(1)} MB). Upgrade your farm capacity.`);
        return;
      }

      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreview(url);
    } catch (err) {
      setError(err.message);
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
      // 1. Upload media via storage adapter / Edge Function
      const uploadRes = await mediaService.uploadMedia(file);

      // 2. Publish post atomically
      await onPublish({
        caption,
        visibility,
        media: uploadRes,
      });

      // Reset and close
      setFile(null);
      setPreview(null);
      setCaption('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Post">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Farm Quota Status Banner */}
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-4 h-4 text-purple-400" />
            <span>Farm Allowance:</span>
          </div>
          <div className="flex items-center gap-3 font-semibold">
            <span className={farmStatus?.postsRemaining > 0 ? 'text-emerald-400' : 'text-red-400'}>
              {farmStatus?.postsRemaining ?? 3} posts remaining
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-purple-300">
              {((farmStatus?.storageRemainingBytes || 250000000) / 1024 / 1024).toFixed(0)} MB free
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Media Upload Area */}
        <div className="relative border-2 border-dashed border-slate-700 hover:border-purple-500/60 rounded-2xl p-4 text-center cursor-pointer transition">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {preview ? (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
              {file?.type?.startsWith('video') ? (
                <video src={preview} className="max-h-full object-contain" controls />
              ) : (
                <img src={preview} alt="Preview" className="max-h-full object-contain" />
              )}
            </div>
          ) : (
            <div className="py-8 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-200">
                Click or drag & drop media here
              </div>
              <p className="text-xs text-slate-400">
                JPEG, PNG, WebP, GIF, or MP4 (up to 25 MB)
              </p>
            </div>
          )}
        </div>

        {/* Caption */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Caption
          </label>
          <textarea
            rows={3}
            placeholder="Share context, technique, story or thoughts..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500"
            maxLength={2200}
          />
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Audience Visibility
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'public', label: 'Public' },
              { id: 'followers', label: 'Followers' },
              { id: 'private', label: 'Private (Self)' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVisibility(v.id)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition ${
                  visibility === v.id
                    ? 'bg-purple-600/20 text-purple-300 border-purple-500'
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
