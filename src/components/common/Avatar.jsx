import React, { useState, useRef } from 'react';
import { Camera, User } from 'lucide-react';
import { isMockMode } from '../../lib/supabase';

// ─── Deterministic gradient colors from user ID / name ──────────────────
const GRADIENT_PAIRS = [
  ['from-purple-500', 'to-pink-500'],
  ['from-blue-500', 'to-cyan-500'],
  ['from-emerald-500', 'to-teal-500'],
  ['from-amber-500', 'to-orange-500'],
  ['from-rose-500', 'to-red-500'],
  ['from-violet-500', 'to-indigo-500'],
  ['from-fuchsia-500', 'to-purple-500'],
  ['from-sky-500', 'to-blue-500'],
];

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(displayName, username) {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (username) return username.substring(0, 2).toUpperCase();
  return '?';
}

const AVATAR_STORAGE_KEY = 'aura_user_avatars';

function getSavedAvatar(userId) {
  try {
    const store = JSON.parse(localStorage.getItem(AVATAR_STORAGE_KEY) || '{}');
    return store[userId] || null;
  } catch { return null; }
}

function saveAvatar(userId, dataUrl) {
  try {
    const store = JSON.parse(localStorage.getItem(AVATAR_STORAGE_KEY) || '{}');
    store[userId] = dataUrl;
    localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(store));
  } catch { /* quota exceeded gracefully */ }
}

/**
 * Avatar — Shows user photo if available, otherwise gradient initials icon.
 *
 * Props:
 *  - src:         avatar URL or data URL (optional)
 *  - userId:      used for persistent avatar storage
 *  - displayName: used for initials
 *  - username:    fallback for initials
 *  - size:        'xs' | 'sm' | 'md' | 'lg' | 'xl' (default 'md')
 *  - editable:    show camera overlay for own profile (default false)
 *  - onAvatarChange: callback(dataUrl) when user picks a new photo
 *  - className:   extra classes
 *  - ring:        ring color class (default 'ring-purple-500/30')
 */
export function Avatar({
  src,
  userId,
  displayName,
  username,
  size = 'md',
  editable = false,
  onAvatarChange,
  className = '',
  ring = 'ring-purple-500/30',
}) {
  const fileRef = useRef(null);
  const savedAvatar = userId ? getSavedAvatar(userId) : null;
  const avatarUrl = src || savedAvatar;

  const initials = getInitials(displayName, username);
  const seed = userId || displayName || username || 'default';
  const [gradFrom, gradTo] = GRADIENT_PAIRS[hashCode(seed) % GRADIENT_PAIRS.length];

  const sizeMap = {
    xs: 'w-6 h-6 text-[8px]',
    sm: 'w-9 h-9 text-[11px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
    xl: 'w-24 h-24 text-xl',
    '2xl': 'w-28 h-28 text-2xl',
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Resize to 256x256 to keep localStorage usage low
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const dim = 256;
        canvas.width = dim;
        canvas.height = dim;
        const ctx = canvas.getContext('2d');
        // Center-crop
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, dim, dim);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (userId) saveAvatar(userId, dataUrl);
        if (onAvatarChange) onAvatarChange(dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName || username || 'User'}
          className={`${sizeMap[size] || sizeMap.md} rounded-full object-cover ring-2 ${ring}`}
        />
      ) : (
        <div
          className={`${sizeMap[size] || sizeMap.md} rounded-full bg-gradient-to-br ${gradFrom} ${gradTo} ring-2 ${ring} flex items-center justify-center font-bold text-white select-none`}
        >
          {initials}
        </div>
      )}

      {editable && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
            title="Change profile picture"
          >
            <Camera className="w-5 h-5 text-white" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  );
}
