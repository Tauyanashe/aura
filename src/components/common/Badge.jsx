import React from 'react';
import clsx from 'clsx';

export function Badge({ children, variant = 'neutral', className = '' }) {
  const variants = {
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    purple: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    pink: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  };

  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', variants[variant], className)}>
      {children}
    </span>
  );
}
