import React, { useState } from 'react';
import { Flag, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { moderationService } from '../../services/moderation.service';

export function ReportModal({ isOpen, onClose, targetPost, reporterId, onReportSubmitted }) {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetPost) return;

    setLoading(true);
    setError('');

    try {
      await moderationService.submitReport({
        reporterId,
        postId: targetPost.id,
        reportedUserId: targetPost.userId,
        reason,
        details,
      });

      if (onReportSubmitted) {
        onReportSubmitted();
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Content to Moderation">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-300">
          Our moderation team reviews reported content against community safety and copyright guidelines.
        </p>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Reason
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
          >
            <option value="spam">Spam / Excessive Promotion</option>
            <option value="harassment">Harassment / Bullying</option>
            <option value="inappropriate">Inappropriate / Explicit Material</option>
            <option value="copyright">Copyright Infringement / Plagiarism</option>
            <option value="misinformation">Misinformation</option>
            <option value="other">Other Violation</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Additional Details (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Explain context or links to original work..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500"
            maxLength={1000}
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" type="submit" loading={loading} icon={Flag}>
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
