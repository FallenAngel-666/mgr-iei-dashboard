import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToSubmissionRules } from '../../services/firebaseService';
import { ProgressUpdateModal } from './ProgressUpdateModal';
import { WORK_STATUSES } from '../../config/roles';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Upload, 
  FileText, 
  Paperclip, 
  ShieldAlert, 
  ShieldCheck, 
  History,
  TrendingUp,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';

export function MyWorksView({ tasks = [] }) {
  const { currentUser } = useAuth();
  const [selectedTaskForProgress, setSelectedTaskForProgress] = useState(null);
  const [expandedHistories, setExpandedHistories] = useState({});
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [submissionRules, setSubmissionRules] = useState({ weeklyRestriction: true });

  useEffect(() => {
    const unsub = subscribeToSubmissionRules(setSubmissionRules);
    return () => unsub();
  }, []);

  // Filter tasks strictly assigned to the current authenticated user
  const myTasks = tasks.filter((t) => {
    if (!t) return false;
    const byId = t.assignedToId && currentUser?.id && t.assignedToId === currentUser.id;
    const byUsername = t.assignedToUsername && currentUser?.username && t.assignedToUsername === currentUser.username;
    const byName = t.assignedToName && currentUser?.name && t.assignedToName.toLowerCase() === currentUser.name.toLowerCase();
    return byId || byUsername || byName;
  });

  // Calculate cumulative stats for this user
  const totalAssigned = myTasks.length;
  const completedTasks = myTasks.filter(t => t.status === WORK_STATUSES.COMPLETED);
  const inProgressTasks = myTasks.filter(t => t.status === WORK_STATUSES.IN_PROGRESS || t.status === WORK_STATUSES.ASSIGNED || t.status === 'Not Started');
  const awaitingApproval = myTasks.filter(t => 
    t.status === WORK_STATUSES.PENDING_FIRST_LEVEL || 
    t.status === WORK_STATUSES.PENDING_FINAL || 
    t.status === WORK_STATUSES.SUBMITTED
  );
  const changesRequested = myTasks.filter(t => t.status === WORK_STATUSES.REJECTED);

  // Compute total user working minutes from all progress history entries
  let totalUserMinutes = 0;
  myTasks.forEach(t => {
    if (Array.isArray(t.progressHistory)) {
      t.progressHistory.forEach(h => {
        totalUserMinutes += (Number(h.totalMinutes) || 0);
      });
    } else if (t.totalMinutesWorked) {
      totalUserMinutes += Number(t.totalMinutesWorked) || 0;
    }
  });

  const totalUserHours = Math.floor(totalUserMinutes / 60);
  const remainingMinutes = totalUserMinutes % 60;

  const toggleHistory = (taskId) => {
    setExpandedHistories(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case WORK_STATUSES.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case WORK_STATUSES.PENDING_FINAL:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <ShieldCheck className="w-3 h-3" />
            <span>Awaiting Admin Approval</span>
          </span>
        );
      case WORK_STATUSES.PENDING_FIRST_LEVEL:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3" />
            <span>Awaiting First Approval</span>
          </span>
        );
      case WORK_STATUSES.SUBMITTED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3" />
            <span>Submitted</span>
          </span>
        );
      case WORK_STATUSES.REJECTED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3 h-3" />
            <span>Changes Requested</span>
          </span>
        );
      case WORK_STATUSES.IN_PROGRESS:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <TrendingUp className="w-3 h-3" />
            <span>In Progress</span>
          </span>
        );
      case WORK_STATUSES.ASSIGNED:
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <span>Not Started</span>
          </span>
        );
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">High Priority</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">Normal</span>;
    }
  };

  // Filter tasks by status tab
  const filteredTasks = myTasks.filter((t) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'COMPLETED') return t.status === WORK_STATUSES.COMPLETED;
    if (filterStatus === 'IN_PROGRESS') return t.status === WORK_STATUSES.IN_PROGRESS || t.status === WORK_STATUSES.ASSIGNED || t.status === 'Not Started';
    if (filterStatus === 'AWAITING') return t.status === WORK_STATUSES.PENDING_FIRST_LEVEL || t.status === WORK_STATUSES.PENDING_FINAL || t.status === WORK_STATUSES.SUBMITTED;
    if (filterStatus === 'REJECTED') return t.status === WORK_STATUSES.REJECTED;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Total Hours Summary Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-iei-navy-950">
              <div className="w-10 h-10 rounded-2xl bg-iei-navy-950 text-amber-400 flex items-center justify-center font-bold shadow-sm">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-serif text-iei-navy-950 tracking-tight">
                  MY WORKS
                </h1>
                <p className="text-xs text-slate-500">
                  Private dashboard register of official tasks assigned to <strong className="text-iei-navy-900">{currentUser?.name}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* User Total Recorded Hours Badge */}
          <div className="bg-gradient-to-br from-iei-navy-950 to-slate-900 text-white px-5 py-3 rounded-2xl border border-slate-800 shadow-md flex items-center gap-3.5 shrink-0">
            <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block font-mono">
                Total Recorded Working Hours
              </span>
              <span className="text-lg sm:text-xl font-black text-white font-mono">
                {totalUserHours} hrs {remainingMinutes} mins
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Across {totalAssigned} assigned chapter {totalAssigned === 1 ? 'task' : 'tasks'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Assigned</span>
            <span className="text-xl font-black text-iei-navy-950 mt-0.5 block">{totalAssigned}</span>
          </div>
          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Admin Approved</span>
            <span className="text-xl font-black text-emerald-900 mt-0.5 block">{completedTasks.length}</span>
          </div>
          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Awaiting Review</span>
            <span className="text-xl font-black text-amber-900 mt-0.5 block">{awaitingApproval.length}</span>
          </div>
          <div className="p-3 bg-sky-50/70 rounded-2xl border border-sky-200">
            <span className="text-[10px] uppercase font-bold text-sky-700 block">In Progress</span>
            <span className="text-xl font-black text-sky-900 mt-0.5 block">{inProgressTasks.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: `All Tasks (${myTasks.length})` },
          { id: 'IN_PROGRESS', label: `In Progress (${inProgressTasks.length})` },
          { id: 'AWAITING', label: `Awaiting Approval (${awaitingApproval.length})` },
          { id: 'COMPLETED', label: `Completed (${completedTasks.length})` },
          { id: 'REJECTED', label: `Changes Requested (${changesRequested.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === tab.id
                ? 'bg-iei-navy-950 text-amber-400 shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-iei-navy-950">No Assigned Work Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {filterStatus === 'ALL'
              ? 'You currently have no tasks assigned to your account. When the Administrator or Chapter Officers dispatch work to you, it will appear here.'
              : `No tasks matching the "${filterStatus}" filter.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const isExpanded = Boolean(expandedHistories[task.id]);
            const history = Array.isArray(task.progressHistory) ? task.progressHistory : [];
            const taskMinutes = history.reduce((sum, h) => sum + (Number(h.totalMinutes) || 0), 0) || Number(task.totalMinutesWorked) || 0;
            const taskHours = Math.floor(taskMinutes / 60);
            const taskRemMins = taskMinutes % 60;

            return (
              <div
                key={task.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Main Task Header & Overview */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                        <span className="text-[11px] font-mono text-slate-400">ID: {task.id}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-iei-navy-950 tracking-tight pt-1">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Progress Update Action Button */}
                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTaskForProgress(task)}
                        disabled={task.status === WORK_STATUSES.COMPLETED}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                          task.status === WORK_STATUSES.COMPLETED
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-iei-navy-950 hover:bg-slate-900 text-amber-400'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{task.status === WORK_STATUSES.COMPLETED ? 'Completed' : 'Update Progress / Report'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned By</span>
                      <span className="font-semibold text-slate-800 truncate block mt-0.5">
                        {task.assignedByName || 'Chapter Officer'}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {task.assignedByRole || 'Leadership'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Date</span>
                      <span className="font-semibold text-slate-800 block mt-0.5">
                        {task.assignedDate || (task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Deadline</span>
                      <span className="font-semibold text-rose-700 block mt-0.5">
                        {task.deadline || 'Ongoing'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Recorded Duration</span>
                      <span className="font-bold font-mono text-emerald-800 block mt-0.5">
                        {taskHours}h {taskRemMins}m
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Work Progress</span>
                      <span className="font-mono font-bold text-iei-navy-950">{task.progress || 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          task.status === WORK_STATUSES.COMPLETED 
                            ? 'bg-emerald-500' 
                            : (task.progress || 0) >= 75 
                              ? 'bg-blue-600' 
                              : (task.progress || 0) >= 30 
                                ? 'bg-amber-500' 
                                : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.min(100, task.progress || 0)}%` }}
                      />
                    </div>
                  </div>

                  {/* Toggle Submission History */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      onClick={() => toggleHistory(task.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-iei-navy-900 hover:text-iei-gold-700 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>
                        {history.length > 0 
                          ? `Submission & Progress History (${history.length} updates recorded)` 
                          : 'No progress updates recorded yet'}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {task.submittedReport?.rejection && (
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Remarks: {task.submittedReport.rejection.reason}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Submission History */}
                {isExpanded && (
                  <div className="bg-slate-50 p-5 sm:p-6 border-t border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-iei-navy-950 uppercase tracking-wider">
                      Work Progress Log &amp; Uploaded Evidence
                    </h4>

                    {history.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">
                        No progress updates submitted yet. Click "Update Progress / Report" above to log hours and evidence.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {history.slice().reverse().map((entry, idx) => (
                          <div
                            key={entry.id || idx}
                            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-iei-navy-950">
                                  {entry.isFinalReport ? 'Final Work Report' : `Progress Update (${entry.progressPercentage}%)`}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  Work Date: {entry.workDate || 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-emerald-800 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <Clock className="w-3 h-3" />
                                <span>{entry.hoursWorked || 0}h {entry.minutesWorked || 0}m logged</span>
                              </div>
                            </div>

                            {entry.description && (
                              <p className="text-slate-700 leading-relaxed font-medium">
                                {entry.description}
                              </p>
                            )}

                            {(entry.completedWork || entry.remainingWork) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                                {entry.completedWork && (
                                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                    <strong className="text-slate-600 block">Completed:</strong>
                                    <span className="text-slate-700">{entry.completedWork}</span>
                                  </div>
                                )}
                                {entry.remainingWork && (
                                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                    <strong className="text-slate-600 block">Remaining:</strong>
                                    <span className="text-slate-700">{entry.remainingWork}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Uploaded Evidence Files */}
                            {Array.isArray(entry.attachments) && entry.attachments.length > 0 && (
                              <div className="pt-2 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                  Attached Evidence ({entry.attachments.length} files):
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {entry.attachments.map((file, fIdx) => (
                                    <a
                                      key={fIdx}
                                      href={file.url || '#'}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-iei-navy-950 font-medium text-[11px] border border-slate-200"
                                    >
                                      {file.type?.startsWith('image') ? (
                                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                                      ) : (
                                        <FileText className="w-3.5 h-3.5 text-rose-600" />
                                      )}
                                      <span className="truncate max-w-[180px]">{file.name || 'Evidence Document'}</span>
                                      <ExternalLink className="w-3 h-3 text-slate-400" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Update Modal */}
      {selectedTaskForProgress && (
        <ProgressUpdateModal
          isOpen={!!selectedTaskForProgress}
          onClose={() => setSelectedTaskForProgress(null)}
          task={selectedTaskForProgress}
          weeklyRestriction={submissionRules.weeklyRestriction}
        />
      )}
    </div>
  );
}
