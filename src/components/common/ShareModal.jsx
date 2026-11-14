import React, { useState } from 'react';
import { Copy, Check, Share2, QrCode, ExternalLink } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ShareModal({ isOpen, onClose, post }) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!post) return null;

  const shareUrl = `${window.location.origin}/#post-${post.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author?.displayName || 'AURA Creator'}`,
          text: post.caption || 'Check out this post on AURA!',
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Post" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Post Preview Snippet */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-3">
          <img
            src={post.mediaAsset?.url || post.mediaAsset?.dataUrl || 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=100'}
            alt="Preview"
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-200 block truncate">
              {post.caption || 'AURA Media Post'}
            </span>
            <span className="text-[11px] text-purple-400">
              by @{post.author?.username || 'creator'} • ★ {post.ratingAverage || '5.0'}
            </span>
          </div>
        </div>

        {/* Share Link Row */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Direct Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
            />
            <Button size="sm" variant={copied ? 'secondary' : 'primary'} onClick={handleCopy} icon={copied ? Check : Copy}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={handleNativeShare} icon={Share2} className="w-full">
            Native Share
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowQr(!showQr)} icon={QrCode} className="w-full">
            {showQr ? 'Hide QR' : 'Show QR'}
          </Button>
        </div>

        {/* QR Code Simulation */}
        {showQr && (
          <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center space-y-2 animate-in zoom-in-95">
            <div className="w-40 h-40 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center p-2 text-center text-slate-900 font-mono text-[10px]">
              <div className="space-y-1">
                <QrCode className="w-16 h-16 mx-auto text-slate-900" />
                <span className="block font-bold">AURA POST QR</span>
                <span className="text-[8px] text-slate-600 block break-all">{post.id}</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-600 font-medium">Scan with camera to view on mobile</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
