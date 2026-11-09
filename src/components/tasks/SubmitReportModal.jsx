import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { submitWorkReport } from '../../services/approvalService';
import { isFirstLevelApprover } from '../../config/roles';
import { Send, FileText, Paperclip, AlertCircle, ShieldCheck } from 'lucide-react';

export function SubmitReportModal({ isOpen, onClose, task, onReportSubmitted }) {
  const { currentUser } = useAuth();
  const [reportTitle, setReportTitle] = useState(task ? `Completion Report: ${task.title}` : '');
  const [summary, setSummary] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!task) return null;

  const isOfficer = isFirstLevelApprover(currentUser?.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!summary.trim() || !currentUser) return;

    setLoading(true);
    setError(null);
    try {
      const attachments = [];
      if (attachmentName.trim()) {
        attachments.push({
          name: attachmentName.trim(),
          type: attachmentName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
          size: '1.5 MB',
          url: attachmentUrl.trim() || '#'
        });
      }

      const updated = await submitWorkReport(
        task,
        {
          title: reportTitle.trim() || task.title,
          summary: summary.trim(),
          attachments
        },
        currentUser
      );

      setLoading(false);
      if (onReportSubmitted) onReportSubmitted(updated);
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Official Work Report">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Workflow Destination Notice */}
        <div className={`p-3.5 rounded-xl border text-xs ${
          isOfficer 
            ? 'bg-purple-50/80 border-purple-200 text-purple-900' 
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}>
          <div className="font-bold flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isOfficer 
                ? 'Direct Staff Coordinator Submission (Officer Tier)'
                : 'Two-Level Institutional Approval Required'}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed">
            {isOfficer
              ? 'As a Chapter Officer / First-Level Approver, your report will be forwarded directly to Admin (Staff Coordinator) for final approval.'
              : 'Your report will first be reviewed by one of the 4 First-Level Approvers (Chairman, Vice Chairman, Secretary, or Joint Secretary), then forwarded to the Staff Coordinator.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Task Details Recap */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Work</span>
          <span className="font-bold text-iei-navy-950 block mt-0.5">{task.title}</span>
        </div>

        {/* Report Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Report Title *
          </label>
          <input
            required
            type="text"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="Official title for this work report"
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
          />
        </div>

        {/* Work Summary */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Work Summary & Completed Deliverables *
          </label>
          <textarea
            required
            rows={5}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Detail the work carried out, methodologies used, attendees/participants reached, outcomes achieved, and institutional compliance..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 resize-none"
          />
        </div>

        {/* Attachments */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Official Supporting Documents / Evidence (Optional)
          </label>
          <input
            type="text"
            value={attachmentName}
            onChange={(e) => setAttachmentName(e.target.value)}
            placeholder="Document filename, e.g. Technovation_Final_Brochure.pdf"
            className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
          />
          <input
            type="url"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            placeholder="Direct link to hosted document or image (optional)"
            className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !summary.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-iei-navy-900 hover:bg-iei-navy-800 text-white rounded-lg shadow-sm disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-iei-gold-400" />
            <span>{loading ? 'Submitting...' : 'Submit for Institutional Approval'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
