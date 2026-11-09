import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  isFirstLevelApprover, 
  isStaffCoordinator, 
  WORK_STATUSES 
} from '../../config/roles';
import { ShieldAlert, Send, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export function PendingApprovalsCard({ tasks = [], onReviewReport, onNavigateToApprovals }) {
  const { currentUser } = useAuth();
  const role = currentUser?.role || '';

  const isLevel1 = isFirstLevelApprover(role);
  const isFinal = isStaffCoordinator(role);

  // Filter tasks awaiting approval based on current user's authority
  const pendingL1Tasks = tasks.filter(
    (t) => t.status === WORK_STATUSES.PENDING_FIRST_LEVEL
  );

  const pendingFinalTasks = tasks.filter(
    (t) => t.status === WORK_STATUSES.PENDING_FINAL
  );

  const myAwaitingTasks = tasks.filter(
    (t) =>
      t.assignedToId === currentUser?.id &&
      (t.status === WORK_STATUSES.PENDING_FIRST_LEVEL || t.status === WORK_STATUSES.PENDING_FINAL)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 mb-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-iei-navy-950">
              Work Report Approvals Queue
            </h3>
            <p className="text-xs text-slate-500">
              Two-level institutional approval workflow
            </p>
          </div>
        </div>
        <button
          onClick={onNavigateToApprovals}
          className="text-xs font-bold text-iei-navy-700 hover:text-iei-navy-900 flex items-center gap-1"
        >
          View all in workflow <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Role specific actionable section */}
      {isFinal && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-purple-600" />
              Final Staff Coordinator Approval Required ({pendingFinalTasks.length})
            </span>
            <span className="text-[11px] text-slate-400">
              Only Staff Coordinator approval completes the work
            </span>
          </div>

          {pendingFinalTasks.length === 0 ? (
            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-purple-800 text-center">
              No reports currently waiting for final Staff Coordinator sign-off.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingFinalTasks.map((t) => {
                const rep = t.submittedReport;
                const approver = rep?.firstLevelApproval;
                return (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-iei-navy-950">
                        {t.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                        <span className="text-slate-600 font-medium">
                          Submitted by: <strong className="text-slate-800">{t.assignedToName}</strong> ({t.assignedToRole})
                        </span>
                        {approver && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-semibold border border-purple-200">
                            <UserCheck className="w-3 h-3 text-purple-700" />
                            First-Level Approved By: {approver.approvedByName} — {approver.approvedByRole}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onReviewReport(t)}
                      className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs shrink-0"
                    >
                      Final Review
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* First-Level Approvers Section */}
      {isLevel1 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              First-Level Reviews Pending ({pendingL1Tasks.length})
            </span>
            <span className="text-[11px] text-slate-400">
              Any 1 of 4 first-level officers can approve
            </span>
          </div>

          {pendingL1Tasks.length === 0 ? (
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 text-xs text-amber-800 text-center">
              No member reports waiting for First-Level review.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingL1Tasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-iei-navy-950">
                      {t.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Submitted by: <strong>{t.assignedToName}</strong> ({t.assignedToRole}) • Due: {t.dueDate || 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => onReviewReport(t)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs shrink-0"
                  >
                    1st-Level Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Member's personal reports awaiting review */}
      {!isLevel1 && !isFinal && (
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Your Submitted Reports Status
          </h4>
          {myAwaitingTasks.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
              You have no reports currently awaiting approval.
            </div>
          ) : (
            <div className="space-y-2">
              {myAwaitingTasks.map((t) => (
                <div key={t.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-iei-navy-950">{t.title}</div>
                    <div className="mt-1">
                      <StatusBadge status={t.status} size="xs" />
                    </div>
                  </div>
                  <button
                    onClick={() => onReviewReport(t)}
                    className="text-xs font-semibold text-iei-navy-700 hover:underline"
                  >
                    View Status
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
