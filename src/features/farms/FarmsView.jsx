import React from 'react';
import { Layers, HardDrive, Zap, Info } from 'lucide-react';
import { FarmCard } from '../../components/cards/FarmCard';

export function FarmsView({ catalogue, farmStatus, onAcquireFarm }) {
  const ownedSlugs = new Set((farmStatus?.activeFarms || []).map(f => f.slug || f.farms?.slug));

  return (
    <div className="space-y-8">
      {/* Farm Capacity Status Card */}
      <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              Active Capacity & Allocation
            </span>
            <h2 className="text-2xl font-black text-white">Your Farm Infrastructure</h2>
            <p className="text-xs text-slate-300 max-w-lg">
              Each owned farm grants cumulative Google Drive storage bytes and a monthly posting allowance that safely resets on the 1st of every month.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Monthly Posts</span>
              <span className="text-2xl font-extrabold text-white">
                {farmStatus?.postsRemaining ?? 3}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                of {farmStatus?.postsLimit ?? 3} slots left
              </span>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Drive Storage</span>
              <span className="text-2xl font-extrabold text-white">
                {farmStatus ? Math.round(farmStatus.storageRemainingBytes / 1024 / 1024) : 250}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">MB remaining</span>
            </div>
          </div>
        </div>

        {/* Storage Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Cumulative Storage Consumption</span>
            <span className="text-purple-300 font-bold">{farmStatus?.storageUsagePercent || 0}% Used</span>
          </div>
          <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, farmStatus?.storageUsagePercent || 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Catalogue Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white">Virtual Farm Catalogue</h3>
          <p className="text-xs text-slate-400">
            Choose a farm capacity that suits your publishing frequency. Transactions are simulated for the private beta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {catalogue.map((farm) => (
            <FarmCard
              key={farm.id || farm.slug}
              farm={farm}
              isOwned={ownedSlugs.has(farm.slug)}
              onAcquire={onAcquireFarm}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
