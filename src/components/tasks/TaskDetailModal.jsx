import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { 
  WORK_STATUSES, 
  isFirstLevelApprover, 
  isStaffCoordinator 
} from '../../config/roles';
import { addTaskProgressUpdate } from '../../services/firebaseService';
import { generateWorkReportPDF } from '../../services/pdfService';
import { 
  Clock, 
  Calendar, 
  User, 
  ShieldCheck, 
  Send, 
  FileText, 
  FileDown, 
  AlertCircle, 
  CheckCircle2, 
  PlusCircle, 
  Paperclip 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function TaskDetailModal({ 
  isOpen, 
  onClose, 
  task, 
  onOpenSubmitReport, 
  onOpenReviewReport 
}) {
  const { currentUser } = useAuth();
  const [newUpdateText, setNewUpdateText] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  if (!task) return null;

  const role = currentUser?.role || '';
  const isAssignee = currentUser?.id === task.assignedToId;
  const isLevel1 = isFirstLevelApprover(role);
  const isFinal = isStaffCoordinator(role);

  const canReview = 
    (isLevel1 && task.status === WORK_STATUSES.PENDING_FIRST_LEVEL) ||
    (isFinal && task.status === WORK_STATUSES.PENDING_FINAL);

  const canSubmitReport = 
    isAssignee && 
    (task.status === WORK_STATUSES.ASSIGNED || 
     task.status === WORK_STATUSES.IN_PROGRESS || 
     task.status === WORK_STATUSES.REJECTED);

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!newUpdateText.trim() || !currentUser) return;
    setSubmittingUpdate(true);
    try {
      await addTaskProgressUpdate(task.id, newUpdateText.trim(), currentUser);
      setNewUpdateText('');
      setSubmittingUpdate(false);
    } catch (err) {
      console.error(err);
      setSubmittingUpdate(false);
    }
  };

  const rep = task.submittedReport;
  const firstLevel = rep?.firstLevelApproval;
  const finalApp = rep?.finalApproval;
  const rej = rep?.rejection;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Institutional Task & Work Record" maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Reference ID: {task.id}
            </span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                task.priority === 'Urgent' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {task.priority || 'Normal'} Priority
              </span>
              <StatusBadge status={task.status} size="md" />
            </div>
          </div>

          <h3 className="text-base font-bold text-iei-navy-950">
            {task.title}
          </h3>

          <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed">
            {task.description}
          </p>

          {/* People & Dates Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned To</span>
              <span className="font-bold text-slate-800">{task.assignedToName}</span>
              <span className="block text-[11px] text-slate-500">{task.assignedToRole}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned By</span>
              <span className="font-bold text-slate-800">{task.assignedByName}</span>
              <span className="block text-[11px] text-slate-500">{task.assignedByRole}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Date</span>
              <span className="font-medium text-slate-700">{task.assignedDate || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Due Date</span>
              <span className="font-medium text-slate-700">{task.dueDate || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Submitted Report & Two-Level Approval Trail (CRITICAL SECTION) */}
        {rep && (
          <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-iei-navy-700" />
                <h4 className="text-sm font-bold text-iei-navy-950">
                  Submitted Work Report
                </h4>
              </div>
              {task.status === WORK_STATUSES.COMPLETED && (
                <button
                  onClick={() => generateWorkReportPDF(task)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-iei-navy-900 text-white text-xs font-bold shadow-xs hover:bg-iei-navy-800"
                >
                  <FileDown className="w-3.5 h-3.5 text-iei-gold-400" />
                  <span>Download Signed PDF</span>
                </button>
              )}
            </div>

            <div>
              <div className="text-xs font-bold text-slate-800">{rep.title}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Submitted by {rep.submittedByName} ({rep.submittedByRole}) on{' '}
                {rep.submittedAt ? new Date(rep.submittedAt).toLocaleString() : 'N/A'}
              </div>
              <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl mt-2 leading-relaxed border border-slate-100">
                {rep.summary}
              </div>
            </div>

            {/* Attachments */}
            {rep.attachments && rep.attachments.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-slate-600 block mb-1">
                  Attached Deliverables & Proof:
                </span>
                <div className="flex flex-wrap gap-2">
                  {rep.attachments.map((att, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-iei-navy-900 font-medium"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                      <span>{att.name}</span>
                      <span className="text-[10px] text-slate-500">({att.size})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Two-Level Approval History Audit Trail */}
            <div className="pt-3 border-t border-slate-100">
              <h5 className="text-xs font-bold text-iei-navy-950 uppercase tracking-wider mb-2">
                Approval Decision Trail
              </h5>

              <div className="space-y-2">
                {/* Stage 1: First-Level */}
                <div className={`p-3 rounded-xl border text-xs ${
                  firstLevel 
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : rej?.level === 'First-Level'
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>Stage 1: First-Level Review</span>
                    <span>
                      {firstLevel ? 'APPROVED' : rej?.level === 'First-Level' ? 'REJECTED' : 'PENDING'}
                    </span>
                  </div>

                  {firstLevel ? (
                    <div className="mt-1 text-[11px]">
                      <strong>First-Level Approved By: {firstLevel.approvedByName} — {firstLevel.approvedByRole}</strong>
                      <span className="block text-slate-500">
                        Timestamp: {new Date(firstLevel.approvedAt).toLocaleString()}
                      </span>
                      <p className="mt-1 text-slate-700 italic">"{firstLevel.remarks}"</p>
                    </div>
                  ) : rej?.level === 'First-Level' ? (
                    <div className="mt-1 text-[11px]">
                      <strong>Rejected By: {rej.rejectedByName} — {rej.rejectedByRole}</strong>
                      <span className="block text-rose-600 font-semibold mt-0.5">
                        Reason: {rej.reason}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Awaiting review by any of the 4 First-Level Officers (Chairman, Vice Chairman, Secretary, Joint Secretary).
                    </p>
                  )}
                </div>

                {/* Stage 2: Final Staff Coordinator */}
                <div className={`p-3 rounded-xl border text-xs ${
                  finalApp 
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : rej?.level?.includes('Final')
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>Stage 2: Final Staff Coordinator Approval</span>
                    <span>
                      {finalApp ? 'OFFICIALLY COMPLETED' : rej?.level?.includes('Final') ? 'RETURNED BY STAFF' : 'PENDING FINAL SIGN-OFF'}
                    </span>
                  </div>

                  {finalApp ? (
                    <div className="mt-1 text-[11px]">
                      <strong>Final Approved By: {finalApp.approvedByName} — {finalApp.approvedByRole}</strong>
                      <span className="block text-slate-500">
                        Timestamp: {new Date(finalApp.approvedAt).toLocaleString()}
                      </span>
                      <p className="mt-1 text-slate-700 italic">"{finalApp.remarks}"</p>
                    </div>
                  ) : rej?.level?.includes('Final') ? (
                    <div className="mt-1 text-[11px]">
                      <strong>Rejected By: {rej.rejectedByName} (Staff Coordinator)</strong>
                      <span className="block text-rose-600 font-semibold mt-0.5">
                        Reason: {rej.reason}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Only Staff Coordinator final sign-off officially marks this institutional work as completed.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Updates Timeline */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-iei-navy-950 uppercase tracking-wider">
            Ongoing Progress Updates ({task.updates?.length || 0})
          </h4>

          {/* New progress update input for assignee */}
          {isAssignee && task.status !== WORK_STATUSES.COMPLETED && (
            <form onSubmit={handlePostUpdate} className="flex gap-2">
              <input
                type="text"
                value={newUpdateText}
                onChange={(e) => setNewUpdateText(e.target.value)}
                placeholder="Post a quick progress note on this assignment..."
                className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
              />
              <button
                type="submit"
                disabled={submittingUpdate || !newUpdateText.trim()}
                className="px-3.5 py-2 rounded-lg bg-iei-navy-900 text-white text-xs font-bold shadow-xs hover:bg-iei-navy-800 disabled:opacity-50"
              >
                Add Update
              </button>
            </form>
          )}

          <div className="space-y-2">
            {!task.updates || task.updates.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl">
                No progress updates posted yet.
              </p>
            ) : (
              task.updates.map((up) => (
                <div key={up.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-iei-navy-900">
                      {up.authorName} ({up.authorRole})
                    </span>
                    <span className="text-slate-400">
                      {up.date ? formatDistanceToNow(new Date(up.date), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  <p className="text-slate-700">{up.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Close
          </button>

          {canSubmitReport && (
            <button
              onClick={() => {
                onClose();
                onOpenSubmitReport(task);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-iei-gold-500 hover:bg-iei-gold-600 text-iei-navy-950 rounded-lg shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Work Report</span>
            </button>
          )}

          {canReview && (
            <button
              onClick={() => {
                onClose();
                onOpenReviewReport(task);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-xs ${
                isFinal ? 'bg-purple-700 hover:bg-purple-800' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isFinal ? 'Perform Final Staff Review' : 'Perform 1st-Level Review'}</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
