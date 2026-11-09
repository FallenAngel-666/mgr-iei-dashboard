import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  FileDown, 
  Clock, 
  UserCheck,
  Search,
  ArrowRight
} from 'lucide-react';
import { 
  WORK_STATUSES, 
  isFirstLevelApprover, 
  isStaffCoordinator 
} from '../../config/roles';
import { StatusBadge } from '../common/StatusBadge';
import { ReviewReportModal } from './ReviewReportModal';
import { generateWorkReportPDF } from '../../services/pdfService';

export function ApprovalWorkflowView({ tasks = [] }) {
  const { currentUser } = useAuth();
  const [activeStage, setActiveStage] = useState('level1'); // 'level1', 'level2', 'completed'
  const [selectedTaskForReview, setSelectedTaskForReview] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const role = currentUser?.role || '';
  const isLevel1 = isFirstLevelApprover(role);
  const isFinal = isStaffCoordinator(role);

  // Group tasks
  const level1Tasks = tasks.filter((t) => t.status === WORK_STATUSES.PENDING_FIRST_LEVEL);
  const level2Tasks = tasks.filter((t) => t.status === WORK_STATUSES.PENDING_FINAL);
  const completedTasks = tasks.filter((t) => t.status === WORK_STATUSES.COMPLETED);

  const getCurrentList = () => {
    let list = [];
    if (activeStage === 'level1') list = level1Tasks;
    else if (activeStage === 'level2') list = level2Tasks;
    else if (activeStage === 'completed') list = completedTasks;

    if (!searchQuery.trim()) return list;
    return list.filter((t) => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignedToName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const currentList = getCurrentList();

  return (
    <div className="space-y-6">
      {/* Workflow Explainer Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 text-iei-gold-700 text-xs font-bold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Statutory Governance</span>
        </div>
        <h2 className="text-xl font-bold text-iei-navy-950">
          Two-Level Work Report Approval Workflow
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          IEI Student Chapter work completion requires mandatory two-tier validation. Any ONE of the 4 first-level officers reviews member submissions before escalation to Admin (Staff Coordinator) for final completion.
        </p>

        {/* Workflow Visual Stepper */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between font-bold text-slate-700 mb-1">
              <span>Step 1: Member Submission</span>
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            </div>
            <p className="text-[11px] text-slate-500">
              Assigned member submits report with documentation & proof. Status: <strong>Pending 1st-Level</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="flex items-center justify-between font-bold text-amber-900 mb-1">
              <span>Step 2: 1st-Level Review</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                {level1Tasks.length} Pending
              </span>
            </div>
            <p className="text-[11px] text-amber-800">
              Any 1 of 4 approvers (Chairman, Vice Chairman, Secretary, Joint Sec) reviews and approves.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200">
            <div className="flex items-center justify-between font-bold text-purple-900 mb-1">
              <span>Step 3: Final Staff Coordinator Approval</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-200 text-purple-900 text-[10px] font-bold">
                {level2Tasks.length} Pending
              </span>
            </div>
            <p className="text-[11px] text-purple-800">
              Admin (Staff Coordinator) executes final review. Work is officially sealed as <strong>Completed</strong>.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 pt-6 mt-4 border-t border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveStage('level1')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeStage === 'level1'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>1st-Level Queue ({level1Tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveStage('level2')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeStage === 'level2'
                ? 'bg-purple-700 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Final Staff Queue ({level2Tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveStage('completed')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeStage === 'completed'
                ? 'bg-emerald-700 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed & Sealed Archive ({completedTasks.length})</span>
          </button>
        </div>
      </div>

      {/* Task Queue List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-iei-navy-950 uppercase tracking-wider">
            {activeStage === 'level1' && 'Stage 1: Awaiting First-Level Officer Review'}
            {activeStage === 'level2' && 'Stage 2: Awaiting Staff Coordinator Final Approval'}
            {activeStage === 'completed' && 'Official Chapter Completed Records'}
          </h3>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports in queue..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300"
            />
          </div>
        </div>

        {currentList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No work reports currently in this workflow queue.
          </div>
        ) : (
          <div className="space-y-3">
            {currentList.map((t) => {
              const rep = t.submittedReport || {};
              const firstLevel = rep.firstLevelApproval;
              const finalApp = rep.finalApproval;

              return (
                <div
                  key={t.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {t.id}
                      </span>
                      <StatusBadge status={t.status} size="xs" />
                    </div>

                    <h4 className="text-sm font-bold text-iei-navy-950">
                      {rep.title || t.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {rep.summary || t.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                      <span>Submitted by: <strong>{rep.submittedByName || t.assignedToName}</strong> ({rep.submittedByRole || t.assignedToRole})</span>
                      {firstLevel && (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          First-Level Approved By: {firstLevel.approvedByName} — {firstLevel.approvedByRole}
                        </span>
                      )}
                      {finalApp && (
                        <span className="text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          Final Sign-Off: {finalApp.approvedByName} (Staff Coordinator)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {activeStage === 'level1' && (
                      <button
                        onClick={() => setSelectedTaskForReview(t)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors ${
                          isLevel1
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {isLevel1 ? 'Perform 1st-Level Review' : 'Inspect Report'}
                      </button>
                    )}

                    {activeStage === 'level2' && (
                      <button
                        onClick={() => setSelectedTaskForReview(t)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors ${
                          isFinal
                            ? 'bg-purple-700 hover:bg-purple-800 text-white'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {isFinal ? 'Perform Final Decision' : 'Inspect Report'}
                      </button>
                    )}

                    {activeStage === 'completed' && (
                      <button
                        onClick={() => generateWorkReportPDF(t)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-iei-navy-900 hover:bg-iei-navy-800 text-white text-xs font-bold shadow-xs"
                      >
                        <FileDown className="w-3.5 h-3.5 text-iei-gold-400" />
                        <span>Download Official PDF</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReviewReportModal
        isOpen={!!selectedTaskForReview}
        onClose={() => setSelectedTaskForReview(null)}
        task={selectedTaskForReview}
      />
    </div>
  );
}
