import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { 
  processFirstLevelReview, 
  processFinalApproval 
} from '../../services/approvalService';
import { 
  isFirstLevelApprover, 
  isStaffCoordinator, 
  WORK_STATUSES 
} from '../../config/roles';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Paperclip, 
  UserCheck, 
  AlertCircle 
} from 'lucide-react';

export function ReviewReportModal({ isOpen, onClose, task, onReviewed }) {
  const { currentUser } = useAuth();
  const [decision, setDecision] = useState('approve'); // 'approve' or 'reject'
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!task || !task.submittedReport) return null;

  const role = currentUser?.role || '';
  const isLevel1 = isFirstLevelApprover(role);
  const isFinal = isStaffCoordinator(role);

  const isLevel1Stage = task.status === WORK_STATUSES.PENDING_FIRST_LEVEL;
  const isFinalStage = task.status === WORK_STATUSES.PENDING_FINAL;

  const rep = task.submittedReport;
  const firstLevel = rep.firstLevelApproval;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!remarks.trim() && decision === 'reject') {
      setError('Please provide specific remarks/reason for returning this work report.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let updatedTask;
      if (isLevel1Stage && isLevel1) {
        updatedTask = await processFirstLevelReview(task, currentUser, decision, remarks.trim());
      } else if (isFinalStage && isFinal) {
        updatedTask = await processFinalApproval(task, currentUser, decision, remarks.trim());
      } else {
        throw new Error('You do not possess the required institutional authority to evaluate this stage.');
      }

      setLoading(false);
      if (onReviewed) onReviewed(updatedTask);
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isFinalStage ? "Final Staff Coordinator Approval" : "First-Level Committee Review"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stage Indicator Pill */}
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
          isFinalStage 
            ? 'bg-purple-50 border-purple-200 text-purple-900' 
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2 font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>
              {isFinalStage 
                ? 'STAGE 2: Final Sign-Off by Staff Coordinator' 
                : 'STAGE 1: First-Level Officer Review'}
            </span>
          </div>
          <span className="text-[11px] font-semibold bg-white px-2 py-0.5 rounded shadow-2xs">
            Reviewer: {currentUser?.name}
          </span>
        </div>

        {/* Level 1 Approval Banner (Mandatory requirement when in Final Review) */}
        {isFinalStage && firstLevel && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
            <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800 mb-1">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>
                First-Level Approved By: {firstLevel.approvedByName} — {firstLevel.approvedByRole}
              </span>
            </div>
            <div className="text-[11px] text-emerald-700">
              Approved on: {new Date(firstLevel.approvedAt).toLocaleString()}
            </div>
            {firstLevel.remarks && (
              <div className="text-xs text-emerald-900 mt-1.5 italic bg-white/70 p-2 rounded-lg border border-emerald-100">
                "{firstLevel.remarks}"
              </div>
            )}
          </div>
        )}

        {/* Submitted Report Summary */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Report Details</span>
            <h4 className="text-sm font-bold text-iei-navy-950 mt-0.5">{rep.title}</h4>
            <span className="text-[11px] text-slate-500">
              Submitted by <strong>{rep.submittedByName}</strong> ({rep.submittedByRole})
            </span>
          </div>

          <div className="mt-2 text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap">
            {rep.summary}
          </div>

          {rep.attachments && rep.attachments.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Attached Documents / Evidence
              </span>
              <div className="flex flex-wrap gap-2">
                {rep.attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-[11px] font-medium text-slate-700">
                    <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                    <span>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Decision Toggle */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Your Official Review Decision *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDecision('approve')}
              className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                decision === 'approve'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {isFinalStage ? 'Approve & Mark Completed' : 'Approve & Forward to Staff'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('reject')}
              className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                decision === 'reject'
                  ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Reject & Return for Revision</span>
            </button>
          </div>
        </div>

        {/* Remarks Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {decision === 'approve' ? 'Review Remarks / Endorsement (Optional)' : 'Rejection Reason & Required Corrections *'}
          </label>
          <textarea
            required={decision === 'reject'}
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={
              decision === 'approve'
                ? 'e.g. Verified deliverables and budget compliance. Approved.'
                : 'State exactly what is missing, incomplete, or requires rectification before resubmission...'
            }
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 resize-none"
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
            disabled={loading}
            className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm disabled:opacity-50 ${
              decision === 'approve'
                ? isFinalStage ? 'bg-purple-700 hover:bg-purple-800' : 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {loading ? 'Recording Decision...' : decision === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
