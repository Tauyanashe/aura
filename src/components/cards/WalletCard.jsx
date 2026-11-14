import React from 'react';
import { Coins, ArrowDownLeft, ArrowUpRight, ShieldCheck, History } from 'lucide-react';

export function WalletCard({ wallet }) {
  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 border border-purple-500/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              Aura Points (AP) Wallet
            </span>
            <div className="text-4xl font-extrabold text-white mt-2 flex items-baseline gap-2">
              <span>{wallet?.balance ?? 0}</span>
              <span className="text-sm font-semibold text-amber-400">AP</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Lifetime Earned: <strong className="text-slate-200">{wallet?.lifetimeEarned ?? 0} AP</strong>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 max-w-xs space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Immutable Ledger</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Maintained strictly by server-side RPC triggers. Protected against client tampering and bot farming rings.
            </p>
          </div>
        </div>
      </div>

      {/* Ledger History */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-purple-400" />
          Recent AP Ledger Transactions
        </h3>

        <div className="divide-y divide-slate-800/80">
          {(wallet?.transactions || []).length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No transactions recorded yet.</p>
          ) : (
            wallet.transactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {tx.amount > 0 ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">{tx.description || tx.transactionType}</div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(tx.createdAt || tx.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className={`font-bold font-mono ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount} AP
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
