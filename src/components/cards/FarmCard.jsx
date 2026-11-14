import React from 'react';
import { Layers, HardDrive, Check, Zap } from 'lucide-react';
import { Button } from '../common/Button';

export function FarmCard({ farm, isOwned, onAcquire }) {
  return (
    <div className={`glass-card p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
      isOwned ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' : 'hover:border-slate-700'
    }`}>
      {farm.isFreeTier && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Default Beta Tier
        </div>
      )}

      {isOwned && !farm.isFreeTier && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
          Active Farm
        </div>
      )}

      <div className="space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
          <Layers className="w-6 h-6 text-purple-400" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-100">{farm.name}</h3>
          <p className="text-xs text-slate-400 mt-1">{farm.description}</p>
        </div>

        <div className="py-2 border-y border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Monthly Allowance
            </span>
            <span className="font-semibold text-slate-200">{farm.monthlyPostLimit} posts / mo</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              Storage Capacity
            </span>
            <span className="font-semibold text-slate-200">{farm.storageFormatted}</span>
          </div>
        </div>

        <ul className="space-y-1.5 text-xs text-slate-400">
          {farm.features?.map((f, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-6 mt-4 border-t border-slate-800/80">
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-xs text-slate-400">Cost</span>
          <div>
            <span className="text-2xl font-extrabold text-white">
              {farm.monthlyPrice === 0 ? 'Free' : `$${farm.monthlyPrice}`}
            </span>
            {farm.monthlyPrice > 0 && <span className="text-xs text-slate-400"> / month</span>}
          </div>
        </div>

        {isOwned ? (
          <Button variant="secondary" className="w-full" disabled>
            Farm Active
          </Button>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            onClick={() => onAcquire(farm.slug)}
          >
            Claim Farm (Simulated)
          </Button>
        )}
      </div>
    </div>
  );
}
