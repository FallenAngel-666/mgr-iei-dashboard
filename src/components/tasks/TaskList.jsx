import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  AlertCircle,
  FileText,
  User,
  ArrowUpRight
} from 'lucide-react';
import { WORK_STATUSES, canAssignWork } from '../../config/roles';
import { StatusBadge } from '../common/StatusBadge';
import { AssignTaskModal } from './AssignTaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { SubmitReportModal } from './SubmitReportModal';

export function TaskList({ 
  tasks = [], 
  members = [], 
  onOpenReviewReport 
}) {
  const { currentUser } = useAuth();
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'my_tasks', 'awaiting_approval', 'in_progress', 'completed', 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForReport, setTaskForReport] = useState(null);

  const canCreate = canAssignWork(currentUser?.role);

  const filteredTasks = tasks.filter((t) => {
    // Tab filter
    if (filterTab === 'my_tasks' && t.assignedToId !== currentUser?.id) return false;
    if (filterTab === 'awaiting_approval' && !(t.status === WORK_STATUSES.PENDING_FIRST_LEVEL || t.status === WORK_STATUSES.PENDING_FINAL)) return false;
    if (filterTab === 'in_progress' && !(t.status === WORK_STATUSES.ASSIGNED || t.status === WORK_STATUSES.IN_PROGRESS)) return false;
    if (filterTab === 'completed' && t.status !== WORK_STATUSES.COMPLETED) return false;
    if (filterTab === 'rejected' && t.status !== WORK_STATUSES.REJECTED) return false;

    // Search query
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignedToName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignedByName.toLowerCase().includes(searchQuery.toLowerCase());

    // Priority
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 text-iei-gold-700 text-xs font-bold uppercase tracking-wider">
              <CheckSquare className="w-4 h-4" />
              <span>Chapter Operations</span>
            </div>
            <h2 className="text-xl font-bold text-iei-navy-950 mt-0.5">
              Work Assignments & Task Register
            </h2>
            <p className="text-xs text-slate-500">
              Manage individual committee task assignments, track progress, and submit official completion reports.
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-iei-navy-900 hover:bg-iei-navy-800 text-white text-xs font-bold shadow-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4 text-iei-gold-400" />
              <span>Assign New Work</span>
            </button>
          )}
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-4 border-b border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterTab === 'all'
                ? 'bg-iei-navy-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Work ({tasks.length})
          </button>
          <button
            onClick={() => setFilterTab('my_tasks')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterTab === 'my_tasks'
                ? 'bg-iei-navy-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            My Assigned Tasks ({tasks.filter((t) => t.assignedToId === currentUser?.id).length})
          </button>
          <button
            onClick={() => setFilterTab('awaiting_approval')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterTab === 'awaiting_approval'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Awaiting Approval ({tasks.filter((t) => t.status === WORK_STATUSES.PENDING_FIRST_LEVEL || t.status === WORK_STATUSES.PENDING_FINAL).length})
          </button>
          <button
            onClick={() => setFilterTab('in_progress')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterTab === 'in_progress'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            In Progress ({tasks.filter((t) => t.status === WORK_STATUSES.ASSIGNED || t.status === WORK_STATUSES.IN_PROGRESS).length})
          </button>
          <button
            onClick={() => setFilterTab('completed')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterTab === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Completed ({tasks.filter((t) => t.status === WORK_STATUSES.COMPLETED).length})
          </button>
          <button
            onClick={() => setFilterTab('rejected')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterTab === 'rejected'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Rejected ({tasks.filter((t) => t.status === WORK_STATUSES.REJECTED).length})
          </button>
        </div>

        {/* Search and Priority Selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search work title, assignee..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs text-slate-500 font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No work assignments found</h4>
            <p className="text-xs text-slate-400 mt-1">Adjust filters or assign a new task to committee members.</p>
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTask(t)}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.priority === 'Urgent' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {t.priority}
                  </span>
                  <StatusBadge status={t.status} size="xs" />
                </div>

                <h3 className="text-sm font-bold text-iei-navy-950 line-clamp-2">
                  {t.title}
                </h3>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {t.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <strong className="text-slate-800 truncate">{t.assignedToName}</strong>
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {t.assignedToRole}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Due: {t.dueDate || 'N/A'}
                  </span>
                  <span className="font-semibold text-iei-navy-700 hover:underline flex items-center gap-0.5">
                    View <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <AssignTaskModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        members={members}
      />

      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onOpenSubmitReport={(t) => setTaskForReport(t)}
        onOpenReviewReport={(t) => onOpenReviewReport && onOpenReviewReport(t)}
      />

      <SubmitReportModal
        isOpen={!!taskForReport}
        onClose={() => setTaskForReport(null)}
        task={taskForReport}
        onReportSubmitted={(updated) => {
          setSelectedTask(updated);
        }}
      />
    </div>
  );
}
