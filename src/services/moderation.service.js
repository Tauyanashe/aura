import { supabase, isMockMode } from '../lib/supabase';

const MOCK_REPORTS_KEY = 'aura_mock_reports';

const INITIAL_MOCK_REPORTS = [
  {
    id: 'rep-01',
    postId: 'post-101',
    reporterId: 'user-tapiwa',
    reporterUsername: 'tapiwa_dev',
    reportedUsername: 'elena_v',
    reason: 'copyright',
    details: 'Verifying if the artwork is properly attributed under CC-BY license.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export const moderationService = {
  async submitReport({ reporterId, postId, reportedUserId, reason, details }) {
    if (isMockMode) {
      const reports = JSON.parse(localStorage.getItem(MOCK_REPORTS_KEY) || JSON.stringify(INITIAL_MOCK_REPORTS));
      const newReport = {
        id: 'rep-' + Math.random().toString(36).substring(2, 9),
        reporterId,
        postId,
        reportedUserId,
        reason,
        details,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      reports.unshift(newReport);
      localStorage.setItem(MOCK_REPORTS_KEY, JSON.stringify(reports));
      return newReport;
    }

    const { data, error } = await supabase
      .from('content_reports')
      .insert({
        reporter_id: reporterId,
        post_id: postId,
        reported_user_id: reportedUserId,
        reason,
        details,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getReports() {
    if (isMockMode) {
      return JSON.parse(localStorage.getItem(MOCK_REPORTS_KEY) || JSON.stringify(INITIAL_MOCK_REPORTS));
    }

    const { data, error } = await supabase
      .from('content_reports')
      .select('*, profiles!content_reports_reporter_id_fkey(username), posts(caption)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateReportStatus(reportId, status, resolutionNotes, moderatorId) {
    if (isMockMode) {
      const reports = JSON.parse(localStorage.getItem(MOCK_REPORTS_KEY) || JSON.stringify(INITIAL_MOCK_REPORTS));
      const rep = reports.find(r => r.id === reportId);
      if (rep) {
        rep.status = status;
        rep.resolutionNotes = resolutionNotes;
        rep.resolvedAt = new Date().toISOString();
        localStorage.setItem(MOCK_REPORTS_KEY, JSON.stringify(reports));
      }
      return rep;
    }

    const { data, error } = await supabase
      .from('content_reports')
      .update({
        status,
        resolution_notes: resolutionNotes,
        resolved_by: moderatorId,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
