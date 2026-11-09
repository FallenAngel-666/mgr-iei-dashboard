import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  FileDown, 
  Printer, 
  Filter, 
  User, 
  CalendarRange, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Building2 
} from 'lucide-react';
import { WORK_STATUSES } from '../../config/roles';
import { StatusBadge } from '../common/StatusBadge';
import { 
  generateWeeklyStatusPDF, 
  generateWorkReportPDF, 
  generateAttendancePDF 
} from '../../services/pdfService';

export function ReportsCenter({ tasks = [], members = [], events = [], attendance = [] }) {
  const { currentUser } = useAuth();
  const [reportType, setReportType] = useState('weekly'); // 'weekly', 'completed', 'member', 'pending', 'attendance'
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [selectedWeek, setSelectedWeek] = useState('Current Week (Week 45)');
  const [selectedAttendanceId, setSelectedAttendanceId] = useState(attendance[0]?.id || '');

  // Computed data based on selection
  const completedTasks = tasks.filter((t) => t.status === WORK_STATUSES.COMPLETED);
  const pendingTasks = tasks.filter((t) => t.status !== WORK_STATUSES.COMPLETED);
  const memberTasks = tasks.filter((t) => t.assignedToId === selectedMemberId);
  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedAtt = attendance.find((a) => a.id === selectedAttendanceId);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (reportType === 'weekly') {
      const summary = {
        total: tasks.length,
        completed: completedTasks.length,
        inProgress: tasks.filter((t) => t.status === WORK_STATUSES.IN_PROGRESS).length,
        awaitingApproval: tasks.filter((t) => t.status === WORK_STATUSES.PENDING_FIRST_LEVEL || t.status === WORK_STATUSES.PENDING_FINAL).length,
        rejected: tasks.filter((t) => t.status === WORK_STATUSES.REJECTED).length
      };
      generateWeeklyStatusPDF(selectedWeek, tasks, summary);
    } else if (reportType === 'attendance' && selectedAtt) {
      generateAttendancePDF(selectedAtt);
    } else if (reportType === 'completed' && completedTasks.length > 0) {
      generateWorkReportPDF(completedTasks[0]);
    } else if (reportType === 'member' && memberTasks.length > 0) {
      generateWorkReportPDF(memberTasks[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 text-iei-gold-700 text-xs font-bold uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>Institutional Records</span>
            </div>
            <h2 className="text-xl font-bold text-iei-navy-950 mt-0.5">
              Chapter Reports & Archival Center
            </h2>
            <p className="text-xs text-slate-500">
              Generate formatted PDF reports for University authorities, accreditation audits (NAAC/NBA), and IEI State Centre.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-iei-navy-900 hover:bg-iei-navy-800 text-white text-xs font-bold shadow-md transition-all"
            >
              <FileDown className="w-4 h-4 text-iei-gold-400" />
              <span>Download Official PDF</span>
            </button>
          </div>
        </div>

        {/* Report Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 text-xs font-semibold">
          <button
            onClick={() => setReportType('weekly')}
            className={`p-2.5 rounded-xl border transition-all text-center ${
              reportType === 'weekly'
                ? 'border-iei-navy-900 bg-iei-navy-900 text-white shadow-xs font-bold'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Weekly Status Report
          </button>
          <button
            onClick={() => setReportType('completed')}
            className={`p-2.5 rounded-xl border transition-all text-center ${
              reportType === 'completed'
                ? 'border-iei-navy-900 bg-iei-navy-900 text-white shadow-xs font-bold'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Completed Work & Audits
          </button>
          <button
            onClick={() => setReportType('member')}
            className={`p-2.5 rounded-xl border transition-all text-center ${
              reportType === 'member'
                ? 'border-iei-navy-900 bg-iei-navy-900 text-white shadow-xs font-bold'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Member Work Profile
          </button>
          <button
            onClick={() => setReportType('pending')}
            className={`p-2.5 rounded-xl border transition-all text-center ${
              reportType === 'pending'
                ? 'border-iei-navy-900 bg-iei-navy-900 text-white shadow-xs font-bold'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending / In-Progress Tasks
          </button>
          <button
            onClick={() => setReportType('attendance')}
            className={`p-2.5 rounded-xl border transition-all text-center ${
              reportType === 'attendance'
                ? 'border-iei-navy-900 bg-iei-navy-900 text-white shadow-xs font-bold'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Meeting Attendance Sheets
          </button>
        </div>

        {/* Dynamic Secondary Selectors */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          {reportType === 'member' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Select Member:</span>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.role}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'attendance' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Select Meeting/Event:</span>
              <select
                value={selectedAttendanceId}
                onChange={(e) => setSelectedAttendanceId(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                {attendance.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.eventTitle} ({a.date})
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'weekly' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Report Cycle:</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Current Week (Week 45)">Current Week (Week 45)</option>
                <option value="Week 44 (Oct 26 - Nov 01)">Week 44 (Oct 26 - Nov 01)</option>
                <option value="Week 43 (Oct 19 - Oct 25)">Week 43 (Oct 19 - Oct 25)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Rendered Institutional Report Canvas */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-lg p-6 sm:p-10 font-sans max-w-5xl mx-auto print:border-none print:shadow-none print:p-0">
        {/* Official University Letterhead Banner */}
        <div className="border-b-2 border-iei-navy-900 pb-5 text-center">
          <div className="flex items-center justify-between gap-4">
            <img 
              src="/assets/apk-logo.png" 
              alt="IEI Emblem" 
              className="w-16 h-16 object-contain hidden sm:block"
            />
            <div className="flex-1">
              <h1 className="text-base sm:text-lg font-black text-iei-navy-950 uppercase tracking-tight">
                Dr. M.G.R. Educational and Research Institute
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-600 font-medium">
                (Deemed to be University | Graded Autonomy Status | Accredited with A+ Grade by NAAC)
              </p>
              <h2 className="text-xs sm:text-sm font-bold text-iei-gold-700 uppercase tracking-wide mt-1">
                The Institution of Engineers (India) — MGR Student Chapter
              </h2>
              <p className="text-[10px] text-slate-500">
                Established by Royal Charter 1935 | Maduravoyal, Chennai - 600 095, Tamil Nadu
              </p>
            </div>
            <img 
              src="/assets/website-logo.png" 
              alt="MGR DU" 
              className="h-12 w-auto object-contain hidden sm:block"
            />
          </div>
        </div>

        {/* Report Content */}
        <div className="py-6">
          {reportType === 'weekly' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-iei-navy-950">
                  WEEKLY STATUS & GOVERNANCE REPORT — {selectedWeek.toUpperCase()}
                </h3>
                <span className="text-xs text-slate-500">
                  Generated: {new Date().toLocaleDateString()}
                </span>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-iei-navy-900 text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">Work Title</th>
                      <th className="py-2.5 px-3 font-bold">Assigned To</th>
                      <th className="py-2.5 px-3 font-bold">Status</th>
                      <th className="py-2.5 px-3 font-bold">1st-Level Approver</th>
                      <th className="py-2.5 px-3 font-bold">Final Approver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.map((t) => (
                      <tr key={t.id}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs">{t.title}</td>
                        <td className="py-2.5 px-3">{t.assignedToName} ({t.assignedToRole})</td>
                        <td className="py-2.5 px-3"><StatusBadge status={t.status} size="xs" /></td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-600">
                          {t.submittedReport?.firstLevelApproval ? t.submittedReport.firstLevelApproval.approvedByName : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-600">
                          {t.submittedReport?.finalApproval ? t.submittedReport.finalApproval.approvedByName : 'Pending'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'completed' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-iei-navy-950 border-b border-slate-200 pb-2">
                OFFICIALLY COMPLETED WORK & APPROVAL AUDIT REGISTER
              </h3>
              <div className="space-y-3">
                {completedTasks.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
                    <div className="flex items-center justify-between font-bold text-iei-navy-950">
                      <span>{t.title}</span>
                      <span className="text-emerald-700">COMPLETED & SEALED</span>
                    </div>
                    <p className="text-slate-600 mt-1">{t.submittedReport?.summary || t.description}</p>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap gap-4 text-[11px] text-slate-500">
                      <span>Completed By: <strong>{t.assignedToName}</strong></span>
                      <span>1st-Level: <strong>{t.submittedReport?.firstLevelApproval?.approvedByName}</strong></span>
                      <span>Staff Coordinator: <strong>{t.submittedReport?.finalApproval?.approvedByName}</strong></span>
                      <span>Date: <strong>{t.submittedReport?.finalApproval?.approvedAt ? new Date(t.submittedReport.finalApproval.approvedAt).toLocaleDateString() : 'N/A'}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportType === 'member' && selectedMember && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <h3 className="text-base font-bold text-iei-navy-950">{selectedMember.name}</h3>
                  <p className="text-slate-500">{selectedMember.role} • {selectedMember.department}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-700 block">ID: {selectedMember.membershipId}</span>
                  <span className="text-emerald-700 font-semibold">{selectedMember.status}</span>
                </div>
              </div>

              <h4 className="text-xs font-bold text-iei-navy-950 uppercase tracking-wider">
                Assigned Work & Milestone Performance ({memberTasks.length})
              </h4>
              <div className="space-y-2">
                {memberTasks.map((t) => (
                  <div key={t.id} className="p-3 border border-slate-200 rounded-lg text-xs flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-slate-900 block">{t.title}</span>
                      <span className="text-[11px] text-slate-400">Due: {t.dueDate || 'N/A'}</span>
                    </div>
                    <StatusBadge status={t.status} size="xs" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportType === 'attendance' && selectedAtt && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <h3 className="text-sm font-bold text-iei-navy-950">{selectedAtt.eventTitle}</h3>
                <p className="text-slate-500">{selectedAtt.category} • Recorded: {selectedAtt.date} by {selectedAtt.recordedByName}</p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-iei-navy-900 text-white uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Member Name</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedAtt.records?.map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{r.name}</td>
                        <td className="py-2 px-3 text-slate-500">{r.role}</td>
                        <td className="py-2 px-3 text-right font-bold">{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Official Signatures Verification Footer */}
        <div className="mt-12 pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="h-10"></div>
            <div className="border-t border-slate-400 pt-1 font-bold text-iei-navy-950">
              SECRETARY / JOINT SECRETARY
            </div>
            <span className="text-[10px] text-slate-500">MGR IEI Student Chapter</span>
          </div>

          <div>
            <div className="h-10"></div>
            <div className="border-t border-slate-400 pt-1 font-bold text-iei-navy-950">
              ADMIN (STAFF COORDINATOR)
            </div>
            <span className="text-[10px] text-slate-500">Dr. M.G.R. Educational and Research Institute</span>
          </div>
        </div>
      </div>
    </div>
  );
}
