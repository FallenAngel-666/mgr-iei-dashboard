import React, { useState } from 'react';
import { 
  CalendarRange, 
  FileDown, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  AlertCircle, 
  ArrowUpRight,
  Filter,
  BarChart3
} from 'lucide-react';
import { WORK_STATUSES } from '../../config/roles';
import { StatusBadge } from '../common/StatusBadge';
import { generateWeeklyStatusPDF } from '../../services/pdfService';

export function WeeklyStatusSection({ tasks = [], updates = [], onSelectTask }) {
  const [selectedWeek, setSelectedWeek] = useState('Current Week (Week 45)');

  // Week options
  const weekOptions = [
    { label: 'Current Week (Week 45)', tag: '2026-W45' },
    { label: 'Week 44 (Oct 26 - Nov 01)', tag: '2026-W44' },
    { label: 'Week 43 (Oct 19 - Oct 25)', tag: '2026-W43' },
    { label: 'All Recorded Weeks', tag: 'all' }
  ];

  // Filter tasks by week
  const filteredTasks = tasks.filter((t) => {
    const currentOpt = weekOptions.find((w) => w.label === selectedWeek);
    if (!currentOpt || currentOpt.tag === 'all') return true;
    return t.weeklyTag === currentOpt.tag || (!t.weeklyTag && currentOpt.tag === '2026-W44');
  });

  // Calculate metrics for selected week
  const assignedCount = filteredTasks.length;
  // Strict: only completed with final approval
  const completedCount = filteredTasks.filter((t) => t.status === WORK_STATUSES.COMPLETED).length;
  const pendingCount = filteredTasks.filter(
    (t) => t.status === WORK_STATUSES.ASSIGNED || t.status === WORK_STATUSES.IN_PROGRESS
  ).length;
  const awaitingCount = filteredTasks.filter(
    (t) => t.status === WORK_STATUSES.PENDING_FIRST_LEVEL || t.status === WORK_STATUSES.PENDING_FINAL
  ).length;
  const rejectedCount = filteredTasks.filter((t) => t.status === WORK_STATUSES.REJECTED).length;

  const completionRate = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

  const handleExportPDF = () => {
    generateWeeklyStatusPDF(selectedWeek, filteredTasks, {
      total: assignedCount,
      completed: completedCount,
      inProgress: pendingCount,
      awaitingApproval: awaitingCount,
      rejected: rejectedCount
    });
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-5 sm:p-6 mb-6">
      {/* Header with Title and Week Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-iei-gold-700 text-xs font-bold uppercase tracking-wider">
            <CalendarRange className="w-4 h-4" />
            <span>Institutional Governance</span>
          </div>
          <h2 className="text-lg font-bold text-iei-navy-950 mt-0.5">
            Dedicated Weekly Status & Progress Overview
          </h2>
          <p className="text-xs text-slate-500">
            Official IEI weekly work monitoring. Submitted reports require final Staff Coordinator approval to be counted as completed.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Week Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-iei-navy-500 cursor-pointer shadow-2xs"
            >
              {weekOptions.map((opt) => (
                <option key={opt.tag} value={opt.label}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-iei-navy-900 hover:bg-iei-navy-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            title="Download Official Weekly Status PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-iei-gold-400" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Progress Visualization Bar */}
      <div className="mt-5 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-iei-navy-900 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-iei-gold-600" />
            Weekly Completion Rate: {completionRate}%
          </span>
          <span className="text-slate-500 font-medium">
            {completedCount} of {assignedCount} tasks finalized by Staff Coordinator
          </span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
          <div 
            className="bg-emerald-500 h-full transition-all duration-500" 
            style={{ width: `${completionRate}%` }} 
            title={`Completed: ${completionRate}%`}
          />
          <div 
            className="bg-amber-400 h-full transition-all duration-500" 
            style={{ width: `${assignedCount > 0 ? (awaitingCount / assignedCount) * 100 : 0}%` }} 
            title={`Awaiting Approval: ${awaitingCount}`}
          />
          <div 
            className="bg-blue-400 h-full transition-all duration-500" 
            style={{ width: `${assignedCount > 0 ? (pendingCount / assignedCount) * 100 : 0}%` }} 
            title={`In Progress: ${pendingCount}`}
          />
          <div 
            className="bg-rose-400 h-full transition-all duration-500" 
            style={{ width: `${assignedCount > 0 ? (rejectedCount / assignedCount) * 100 : 0}%` }} 
            title={`Rejected: ${rejectedCount}`}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Completed ({completedCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Awaiting Approval ({awaitingCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span>In Progress ({pendingCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <span>Rejected ({rejectedCount})</span>
          </div>
        </div>
      </div>

      {/* 5 Status Cards for Selected Week */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Assigned This Week</div>
          <div className="text-xl font-extrabold text-iei-navy-950 mt-1">{assignedCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Tasks dispatched</p>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
          <div className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </div>
          <div className="text-xl font-extrabold text-emerald-900 mt-1">{completedCount}</div>
          <p className="text-[10px] text-emerald-600 mt-0.5">Final Staff Approved</p>
        </div>
        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
          <div className="text-[11px] font-bold text-blue-700 uppercase flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Work Pending
          </div>
          <div className="text-xl font-extrabold text-blue-900 mt-1">{pendingCount}</div>
          <p className="text-[10px] text-blue-600 mt-0.5">Assigned & In Progress</p>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
          <div className="text-[11px] font-bold text-amber-800 uppercase flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Awaiting Approval
          </div>
          <div className="text-xl font-extrabold text-amber-900 mt-1">{awaitingCount}</div>
          <p className="text-[10px] text-amber-700 mt-0.5">1st-Level & Final Stage</p>
        </div>
        <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200">
          <div className="text-[11px] font-bold text-rose-700 uppercase flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Rejected Work
          </div>
          <div className="text-xl font-extrabold text-rose-900 mt-1">{rejectedCount}</div>
          <p className="text-[10px] text-rose-600 mt-0.5">Needs Correction</p>
        </div>
      </div>

      {/* Detailed Tasks Register for Selected Week */}
      <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-iei-navy-900 uppercase tracking-wider">
            Weekly Work Register ({filteredTasks.length} items)
          </h3>
          <span className="text-[11px] text-slate-500">
            Click any task to view details or process approval
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No work assignments recorded for {selectedWeek}.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Task Title</th>
                  <th className="py-2.5 px-4 font-bold">Assigned To</th>
                  <th className="py-2.5 px-4 font-bold">Status</th>
                  <th className="py-2.5 px-4 font-bold">1st-Level Approval</th>
                  <th className="py-2.5 px-4 font-bold">Final Approval</th>
                  <th className="py-2.5 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((t) => {
                  const rep = t.submittedReport;
                  const firstLevel = rep?.firstLevelApproval;
                  const finalApp = rep?.finalApproval;

                  return (
                    <tr 
                      key={t.id} 
                      onClick={() => onSelectTask && onSelectTask(t)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-iei-navy-950 max-w-xs truncate">
                        {t.title}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{t.assignedToName}</span>
                        <span className="block text-[10px] text-slate-500">{t.assignedToRole}</span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="py-3 px-4">
                        {firstLevel ? (
                          <div className="text-[11px]">
                            <span className="font-semibold text-emerald-700">Approved</span>
                            <span className="block text-[10px] text-slate-500 truncate max-w-[150px]">
                              {firstLevel.approvedByName} ({firstLevel.approvedByRole})
                            </span>
                          </div>
                        ) : rep?.rejection?.level === 'First-Level' ? (
                          <span className="text-[11px] font-semibold text-rose-600">Rejected at Level 1</span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Pending review</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {finalApp ? (
                          <div className="text-[11px]">
                            <span className="font-semibold text-emerald-700">Staff Approved</span>
                            <span className="block text-[10px] text-slate-500">
                              {finalApp.approvedByName}
                            </span>
                          </div>
                        ) : rep?.rejection?.level?.includes('Final') ? (
                          <span className="text-[11px] font-semibold text-rose-600">Returned by Staff</span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Awaiting Final</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-iei-navy-700 hover:text-iei-navy-900">
                          Inspect <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
