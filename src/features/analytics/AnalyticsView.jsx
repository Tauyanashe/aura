import React from 'react';
import { BarChart3, TrendingUp, Users, HardDrive, Star, Zap, ArrowUpRight } from 'lucide-react';

export function AnalyticsView({ currentUser, farmStatus, wallet, auraScore }) {
  const ratingDistribution = [
    { stars: 5, percent: 75, count: 24 },
    { stars: 4, percent: 18, count: 6 },
    { stars: 3, percent: 7, count: 2 },
    { stars: 2, percent: 0, count: 0 },
    { stars: 1, percent: 0, count: 0 },
  ];

  const storageUsedMb = farmStatus ? Math.round(farmStatus.storageUsedBytes / 1024 / 1024) : 18;
  const apPerMb = storageUsedMb > 0 ? (wallet?.balance / storageUsedMb).toFixed(1) : '24.2';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Creator Performance & Storage Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry on audience reception, rating quality, and farm storage ROI.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          +14% this month
        </span>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 space-y-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            Estimated Reach
          </span>
          <div className="text-2xl font-black text-white">1,840</div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> +120 views
          </span>
        </div>

        <div className="glass-card p-4 space-y-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Engagement Rate
          </span>
          <div className="text-2xl font-black text-white">8.6%</div>
          <span className="text-[10px] text-slate-400">High quality beta tier</span>
        </div>

        <div className="glass-card p-4 space-y-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-yellow-400" />
            Avg. Rating
          </span>
          <div className="text-2xl font-black text-amber-300">4.88</div>
          <span className="text-[10px] text-slate-400">Across 32 reviews</span>
        </div>

        <div className="glass-card p-4 space-y-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            Storage ROI
          </span>
          <div className="text-2xl font-black text-purple-300">{apPerMb}</div>
          <span className="text-[10px] text-slate-400">AP earned per MB</span>
        </div>
      </div>

      {/* Bottom Analytics Section (Side-by-side on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Quality Breakdown (Histogram) */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between">
            <span>Peer Review Rating Distribution</span>
            <span className="text-xs text-amber-400 font-semibold">93% Positive</span>
          </h3>

          <div className="space-y-2.5">
            {ratingDistribution.map((item) => (
              <div key={item.stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-slate-400 font-mono font-medium flex items-center gap-1">
                  {item.stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>

                <div className="flex-1 bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-purple-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>

                <span className="w-10 text-right text-slate-400 font-mono text-[11px]">
                  {item.percent}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Storage Utilization & Efficiency */}
        <div className="glass-card p-6 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-2">Farm Storage Efficiency Analysis</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your current farm allocation provides <strong className="text-white">{farmStatus ? Math.round(farmStatus.totalStorageBytes / 1024 / 1024) : 250} MB</strong> of Google Drive cloud storage. With current publishing compression and average asset size (2.3 MB), you can sustain <strong className="text-purple-300">{Math.floor((farmStatus?.storageRemainingBytes || 200000000) / (2.3 * 1024 * 1024))} more media assets</strong> before reaching capacity.
            </p>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
            Monthly reset takes place on the 1st of each month UTC.
          </div>
        </div>
      </div>
    </div>
  );
}
