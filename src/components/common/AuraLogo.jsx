import React, { useId } from 'react';

/**
 * AuraLogo: High-fidelity "A" lettermark with Instagram-inspired radiant gradient.
 *
 * @param {'sm' | 'md' | 'lg' | 'xl'} size - Container dimensions
 * @param {boolean} withSquircle - Whether to wrap in the glowing squircle border
 * @param {string} className - Additional CSS classes
 */
export function AuraLogo({ size = 'md', withSquircle = true, className = '' }) {
  const uniqueId = useId().replace(/:/g, '');
  const gradientId = `aura-ig-grad-${uniqueId}`;

  // Dimensions configuration
  const sizeMap = {
    sm: { container: 'w-8 h-8 rounded-xl p-[1.5px]', inner: 'rounded-[10px]', svg: 'w-4 h-4' },
    md: { container: 'w-10 h-10 rounded-2xl p-[2px]', inner: 'rounded-[14px]', svg: 'w-5 h-5' },
    lg: { container: 'w-14 h-14 rounded-2xl p-[2.5px]', inner: 'rounded-[14px]', svg: 'w-7 h-7' },
    xl: { container: 'w-20 h-20 rounded-3xl p-[3px]', inner: 'rounded-[21px]', svg: 'w-10 h-10' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const svgIcon = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${currentSize.svg} ${!withSquircle ? className : ''}`}
    >
      <defs>
        {/* Instagram signature gradient stops: Warm Gold -> Coral -> Vibrant Magenta -> Royal Purple */}
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433" />
          <stop offset="25%" stopColor="#e6683c" />
          <stop offset="55%" stopColor="#dc2743" />
          <stop offset="80%" stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>

      {/* Main Stylized "A" Apex & Legs */}
      <path
        d="M 4.75 19.5 L 11.25 4.5 C 11.55 3.8 12.45 3.8 12.75 4.5 L 19.25 19.5"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dynamic Floating Crossbar */}
      <path
        d="M 7.75 14 L 16.25 14"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.6"
        strokeLinecap="round"
      />

      {/* Aura 4-Point Ambient Star at Top-Right */}
      <path
        d="M 18.8 2.8 C 18.8 4.2 19.8 5.2 21.2 5.2 C 19.8 5.2 18.8 6.2 18.8 7.6 C 18.8 6.2 17.8 5.2 16.4 5.2 C 17.8 5.2 18.8 4.2 18.8 2.8 Z"
        fill={`url(#${gradientId})`}
      />

      {/* Micro-sparkle dot at lower left */}
      <circle cx="5" cy="19.5" r="0.8" fill={`url(#${gradientId})`} opacity="0.9" />
    </svg>
  );

  if (!withSquircle) {
    return svgIcon;
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-lg shadow-[#dc2743]/25 ${currentSize.container} ${className}`}
    >
      <div className={`w-full h-full bg-[#090d16] ${currentSize.inner} flex items-center justify-center`}>
        {svgIcon}
      </div>
    </div>
  );
}
