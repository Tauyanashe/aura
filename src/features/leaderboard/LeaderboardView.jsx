import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Sparkles } from 'lucide-react';
import { auraService } from '../../services/aura.service';

export function LeaderboardView() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auraService.getLeaderboard().then((data) => {
      setLeaders(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            AURA Beta Creator Leaderboard
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Top creators ranked by normalized Aura Score (quality, engagement, and consistency).
          </p>
        </div>
      </div>

      <div className="glass-card divide-y divide-slate-800/80">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading leaderboard rankings...</div>
        ) : (
          leaders.map((user, idx) => (
            <div key={user.username || idx} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition">
              <div className="flex items-center gap-4">
                <div className="w-8 text-center font-extrabold text-sm text-slate-400 flex items-center justify-center">
                  {idx === 0 ? <Medal className="w-5 h-5 text-amber-400" /> :
                   idx === 1 ? <Medal className="w-5 h-5 text-slate-300" /> :
                   idx === 2 ? <Medal className="w-5 h-5 text-amber-600" /> :
                   `#${idx + 1}`}
                </div>

                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/20"
                />

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-100">{user.displayName}</span>
                    <span className="text-xs text-slate-400">@{user.username}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span className="text-purple-300 font-medium">{user.tier}</span>
                    <span>•</span>
                    <span>{user.postsCount || 0} published posts</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-extrabold text-white flex items-center gap-1 justify-end">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>{user.score}</span>
                  <span className="text-xs text-purple-300">AS</span>
                </div>
                <div className="text-[10px] text-slate-400">Reputation Level</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
