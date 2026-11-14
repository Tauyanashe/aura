import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Eye, Clock } from 'lucide-react';
import { moderationService } from '../../services/moderation.service';
import { Button } from '../../components/common/Button';

export function ModerationDashboard({ currentUser }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await moderationService.getReports();
      setReports(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (reportId, status, note) => {
    await moderationService.updateReportStatus(reportId, status, note, currentUser?.id);
    fetchReports();
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            AURA Moderator & Staff Control Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review reported items, manage copyright challenges, and audit user integrity.
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full text-xs font-semibold">
          {reports.filter(r => r.status === 'pending').length} Pending Inquiries
        </span>
      </div>

      <div className="glass-card divide-y divide-slate-800/80">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading moderation records...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Clean queue! No reports waiting.</div>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                    {r.reason}
                  </span>
                  <span className="text-xs text-slate-400">
                    Reported by <strong className="text-slate-200">@{r.reporterUsername || 'tester'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(r.createdAt).toLocaleString()}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    r.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-300'
                  }`}>
                    {r.status}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-200 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">Report Details:</span>
                {r.details || 'No additional comment provided by reporter.'}
              </div>

              {r.status === 'pending' && (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAction(r.id, 'dismissed', 'Report dismissed by moderator')}
                    icon={XCircle}
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleAction(r.id, 'resolved', 'Post hidden; warning issued')}
                    icon={AlertTriangle}
                  >
                    Hide & Warn User
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAction(r.id, 'resolved', 'Approved content')}
                    icon={CheckCircle2}
                  >
                    Mark Resolved
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
