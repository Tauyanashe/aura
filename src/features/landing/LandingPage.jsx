import React, { useState } from 'react';
import {
  Sparkles,
  Trophy,
  Crown,
  Flame,
  ArrowRight,
  TrendingUp,
  Shield,
  Layers,
  Coins,
  Star,
  Users,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { RISING_AURA_KINGS } from './landingData';
import { Button } from '../../components/common/Button';

function getRankTitle(creator, timeframe) {
  if (!creator) return '';
  const gender = creator.gender;
  const isFirst = creator.rank === 1;
  if (timeframe === 'daily') {
    if (isFirst) return gender === 'female' ? '👑 Daily Queen' : '👑 Daily King';
    if (creator.rank === 2) return '🥈 Daily Runner-up';
    return '🥉 Daily Bronze';
  } else {
    if (isFirst) return gender === 'female' ? '👑 Reigning Weekly Sovereign' : '👑 Reigning Weekly Sovereign';
    if (creator.rank === 2) return '🥈 Weekly Titan';
    return '🥉 Rising Pioneer';
  }
}

export function LandingPage({ onEnterApp }) {
  const [timeframe, setTimeframe] = useState('daily'); // 'daily' or 'weekly'
  const kingsList = RISING_AURA_KINGS[timeframe];
  const topThree = kingsList.slice(0, 3);
  const runnersUp = kingsList.slice(3);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white">
      {/* Landing Navbar */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 p-0.5 shadow-lg shadow-purple-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white">AURA</span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-extrabold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  Beta
                </span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#rankings" className="hover:text-purple-400 transition flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Aura Royalty
            </a>
            <a href="#how-it-works" className="hover:text-purple-400 transition">
              How It Works
            </a>
            <a href="#farms" className="hover:text-purple-400 transition">
              Virtual Farms
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="primary"
              onClick={onEnterApp}
              className="shadow-lg shadow-purple-500/20"
              icon={ArrowRight}
            >
              Launch Beta App
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-800/60">
        {/* Glow Spheres in background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-600/20 via-pink-600/15 to-transparent blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 font-semibold mb-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Introducing AURA 2026 Private Beta • Reputation-First Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Where Creator Quality Earns{' '}
            <span className="text-gradient">True Sovereign Aura.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
            The social network with <strong>Virtual Farm capacity</strong>, Google Drive media adapters, and <strong>Aura Score reputation</strong>. Zero bot swarms, no engagement rings, and no algorithmic manipulation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" variant="primary" onClick={onEnterApp} icon={ArrowRight}>
              Enter Social Network
            </Button>
            <a
              href="#rankings"
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition text-center"
            >
              Explore Aura Royalty Rankings
            </a>
          </div>

          {/* Social Proof Metric Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 max-w-4xl mx-auto border-t border-slate-800/80">
            <div className="p-3">
              <div className="text-2xl font-black text-white">20–50</div>
              <div className="text-xs text-slate-400 mt-0.5">Invited Beta Creators</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-black text-purple-400">3 Posts/Mo</div>
              <div className="text-xs text-slate-400 mt-0.5">Free Farm Default Quota</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-black text-amber-400">100% Anti-Abuse</div>
              <div className="text-xs text-slate-400 mt-0.5">Fraud-Proof AP Ledger</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-black text-pink-400">Google Drive</div>
              <div className="text-xs text-slate-400 mt-0.5">Isolated Beta Storage</div>
            </div>
          </div>
        </div>
      </section>

      {/* RISING AURA KINGS (Rankings Section) */}
      <section id="rankings" className="py-16 sm:py-24 border-b border-slate-800/60 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Section Header & Timeframe Toggle */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
                  Hall of Influence
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Rising Aura Royalty
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Creators rising through verified peer ratings, constructive community critiques, and quality publications.
              </p>
            </div>

            {/* Daily vs Weekly Toggle */}
            <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1 self-start md:self-auto shadow-inner">
              <button
                onClick={() => setTimeframe('daily')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  timeframe === 'daily'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Daily Rankings (24h)
              </button>
              <button
                onClick={() => setTimeframe('weekly')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  timeframe === 'weekly'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                Weekly Sovereigns (7d)
              </button>
            </div>
          </div>

          {/* Podium (Top 3 Kings) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
            {/* 2nd Place */}
            <div className="order-2 md:order-1 glass-card p-6 rounded-3xl border border-slate-700/80 space-y-4 hover:border-slate-500 transition-all">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                  🥈 Rank #2
                </span>
                <span className="text-[11px] font-bold text-emerald-400">{topThree[1].velocity}</span>
              </div>

              <div className="text-center space-y-2">
                <div className="relative inline-block">
                  <img
                    src={topThree[1].avatar}
                    alt={topThree[1].displayName}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-400/30 mx-auto"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-slate-800 text-slate-200 p-1 rounded-full border-2 border-slate-950 text-xs">
                    🥈
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base">{topThree[1].displayName}</h3>
                  <span className="text-xs text-purple-400">@{topThree[1].username}</span>
                </div>

                <div className="text-xs text-slate-400 line-clamp-2 px-2">{topThree[1].bio}</div>
              </div>

              {/* Featured artwork teaser */}
              <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                <img
                  src={topThree[1].featuredWork}
                  alt="Featured"
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400">Aura Score:</span>
                <span className="font-black text-purple-300 text-sm font-mono">{topThree[1].auraScore} AS</span>
              </div>
            </div>

            {/* 1st Place - The King */}
            <div className="order-1 md:order-2 glass-panel p-8 rounded-3xl border-2 border-amber-500/60 shadow-2xl shadow-amber-500/10 space-y-5 relative overflow-hidden bg-gradient-to-b from-slate-900 via-amber-950/10 to-slate-900 -translate-y-2">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-bl-2xl shadow-lg flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 fill-current" />
                 {topThree[0].gender === 'female' ? (timeframe === 'daily' ? 'Daily Queen' : 'Weekly Sovereign') : (timeframe === 'daily' ? 'Daily King' : 'Weekly Sovereign')}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  🥇 Rank #1
                </span>
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {topThree[0].velocity}
                </span>
              </div>

              <div className="text-center space-y-3">
                <div className="relative inline-block">
                  <img
                    src={topThree[0].avatar}
                    alt={topThree[0].displayName}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-amber-400 shadow-xl shadow-amber-500/30 mx-auto"
                  />
                  <div className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 p-1.5 rounded-full border-2 border-slate-950 shadow-lg animate-bounce">
                    <Crown className="w-4 h-4 fill-current" />
                  </div>
                </div>

                <div>
                  <h3 className="font-black text-white text-lg">{topThree[0].displayName}</h3>
                  <span className="text-xs text-amber-400 font-semibold">@{topThree[0].username}</span>
                  <div className="mt-1">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {topThree[0].tier}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2">{topThree[0].bio}</p>
              </div>

              {/* Featured artwork */}
              <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-slate-950 border border-amber-500/30 shadow-inner">
                <img
                  src={topThree[0].featuredWork}
                  alt="Featured"
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400">Total Aura Score:</span>
                <span className="font-black text-amber-300 text-base font-mono">{topThree[0].auraScore} AS</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="order-3 glass-card p-6 rounded-3xl border border-slate-700/80 space-y-4 hover:border-slate-500 transition-all">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-800 text-amber-600 border border-slate-700 flex items-center gap-1.5">
                  🥉 Rank #3
                </span>
                <span className="text-[11px] font-bold text-emerald-400">{topThree[2].velocity}</span>
              </div>

              <div className="text-center space-y-2">
                <div className="relative inline-block">
                  <img
                    src={topThree[2].avatar}
                    alt={topThree[2].displayName}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-amber-600/30 mx-auto"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-slate-800 text-amber-500 p-1 rounded-full border-2 border-slate-950 text-xs">
                    🥉
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base">{topThree[2].displayName}</h3>
                  <span className="text-xs text-purple-400">@{topThree[2].username}</span>
                </div>

                <div className="text-xs text-slate-400 line-clamp-2 px-2">{topThree[2].bio}</div>
              </div>

              {/* Featured artwork */}
              <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                <img
                  src={topThree[2].featuredWork}
                  alt="Featured"
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400">Aura Score:</span>
                <span className="font-black text-purple-300 text-sm font-mono">{topThree[2].auraScore} AS</span>
              </div>
            </div>
          </div>

          {/* Runners-Up Table */}
          <div className="glass-card rounded-3xl overflow-hidden border border-slate-800">
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Rising Creators Ranking Ladder</span>
              <span className="text-slate-400">Calculated in UTC</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {runnersUp.map((creator) => (
                <div
                  key={creator.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition text-xs"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 font-black text-slate-400 text-sm">#{creator.rank}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        creator.movement.startsWith('+')
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : creator.movement.startsWith('-')
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {creator.movement}
                    </span>

                    <img
                      src={creator.avatar}
                      alt={creator.displayName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/20"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{creator.displayName}</span>
                        <span className="text-slate-400">@{creator.username}</span>
                        <span className="text-[10px] text-purple-300 px-1.5 py-0.2 bg-purple-500/10 rounded border border-purple-500/20">
                          {creator.tier}
                        </span>
                        {creator.gender && (
                          <span className="text-[10px] text-slate-300 px-1.5 py-0.2 bg-slate-800 rounded border border-slate-700">
                            {creator.gender === 'female' ? '♀ Queen' : '♂ King'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{creator.bio}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-white text-sm font-mono">{creator.auraScore} AS</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">{creator.velocity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blueprint Architecture Pillars */}
      <section id="how-it-works" className="py-16 sm:py-24 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-purple-400">
              Technical Principles
            </span>
            <h2 className="text-3xl font-black text-white">Engineered for High-Trust Creators</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Designed around deliberate capacity constraints, server-enforced quotas, and reputation algorithms that resist farming rings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-3xl space-y-3 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Virtual Farm Quotas</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Publishing allowances reset each month. Creators operate within storage quotas, making every post deliberate and high quality.
              </p>
            </div>

            <div className="glass-card p-6 rounded-3xl space-y-3 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Immutable AP Ledger</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Aura Points (AP) cannot be modified directly by clients. Atomic stored procedures enforce daily engagement caps and idempotency.
              </p>
            </div>

            <div className="glass-card p-6 rounded-3xl space-y-3 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <HardDrive className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white">Drive Storage Isolation</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Media bytes are stored securely on Google Drive behind authenticated streaming endpoints that check viewer authorization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-16 text-center bg-gradient-to-t from-purple-950/20 to-transparent">
        <div className="max-w-xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl font-black text-white">Ready to Claim Your Farm?</h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Join the AURA private beta today. Test your creative reach under deliberate capacity rules.
          </p>
          <Button size="lg" variant="primary" onClick={onEnterApp} icon={ArrowRight}>
            Launch AURA Beta Platform
          </Button>
          <div className="pt-6 text-[11px] text-slate-500">
            AURA • Prepared for Private Beta 2026 • Verified Technical Blueprint Architecture
          </div>
        </div>
      </section>
    </div>
  );
}
