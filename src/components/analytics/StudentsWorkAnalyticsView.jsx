import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WORK_STATUSES, ROLES } from '../../config/roles';
import { Modal } from '../common/Modal';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Award, 
  Users, 
  Calendar, 
  Search, 
  Filter, 
  ArrowUpDown, 
  FileText, 
  Eye, 
  ExternalLink,
  Briefcase,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Download
} from 'lucide-react';

export function StudentsWorkAnalyticsView({ tasks = [], members = [] }) {
  const { currentUser } = useAuth();
  const [timeFilter, setTimeFilter] = useState('ALL'); // ALL, WEEKLY, MONTHLY, CUSTOM
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('TOTAL_HOURS'); // TOTAL_HOURS, COMPLETED_WORKS, TOTAL_WORKS, AVERAGE_HOURS, COMPLETION_RATE
  const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);

  // Filter tasks based on time selection
  const filteredTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => {
      if (!t) return false;
      const taskDate = new Date(t.createdAt || t.assignedDate || 0);

      if (timeFilter === 'WEEKLY') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return taskDate >= oneWeekAgo;
      }
      if (timeFilter === 'MONTHLY') {
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return taskDate >= oneMonthAgo;
      }
      if (timeFilter === 'CUSTOM') {
        if (customStart && taskDate < new Date(customStart)) return false;
        if (customEnd) {
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
          if (taskDate > end) return false;
        }
      }
      return true;
    });
  }, [tasks, timeFilter, customStart, customEnd]);

  // Aggregate student performance metrics from actual database records
  const studentMetrics = useMemo(() => {
    // Only student/committee members (exclude pure administrator account)
    const validMembers = members.filter(m => m && m.role !== ROLES.ADMINISTRATOR);

    const map = new Map();

    // Initialize every student in the directory
    validMembers.forEach(m => {
      map.set(m.id, {
        id: m.id,
        name: m.name || 'Student Member',
        username: m.username || 'N/A',
        role: m.role || 'Member',
        department: m.department || 'General',
        email: m.email || '',
        phone: m.phone || '',
        avatar: m.avatar,
        membershipId: m.membershipId || 'N/A',
        totalWorks: 0,
        submittedWorks: 0,
        completedWorks: 0,
        pendingWorks: 0,
        totalMinutes: 0,
        assignedTasks: [],
        completedTasksList: [],
        pendingTasksList: [],
        historyEntries: []
      });
    });

    // Populate actual metrics from distinct tasks
    filteredTasks.forEach(task => {
      // Find matching member
      let targetStudent = null;
      if (task.assignedToId && map.has(task.assignedToId)) {
        targetStudent = map.get(task.assignedToId);
      } else {
        // Fallback match by username or exact name
        for (const s of map.values()) {
          if (task.assignedToUsername && s.username === task.assignedToUsername) {
            targetStudent = s;
            break;
          }
          if (task.assignedToName && s.name.toLowerCase() === task.assignedToName.toLowerCase()) {
            targetStudent = s;
            break;
          }
        }
      }

      if (targetStudent) {
        targetStudent.totalWorks += 1;
        targetStudent.assignedTasks.push(task);

        const isCompleted = task.status === WORK_STATUSES.COMPLETED;
        const isSubmitted = isCompleted || 
                            task.status === WORK_STATUSES.PENDING_FIRST_LEVEL || 
                            task.status === WORK_STATUSES.PENDING_FINAL || 
                            task.status === WORK_STATUSES.SUBMITTED;

        if (isCompleted) {
          targetStudent.completedWorks += 1;
          targetStudent.completedTasksList.push(task);
        } else {
          targetStudent.pendingWorks += 1;
          targetStudent.pendingTasksList.push(task);
        }

        if (isSubmitted) {
          targetStudent.submittedWorks += 1;
        }

        // Aggregate actual recorded durations
        if (Array.isArray(task.progressHistory) && task.progressHistory.length > 0) {
          task.progressHistory.forEach(h => {
            const mins = Number(h.totalMinutes) || 0;
            targetStudent.totalMinutes += mins;
            targetStudent.historyEntries.push({ ...h, taskTitle: task.title, taskId: task.id });
          });
        } else if (task.totalMinutesWorked) {
          targetStudent.totalMinutes += Number(task.totalMinutesWorked) || 0;
        }
      }
    });

    // Calculate derived averages and completion rates
    const list = Array.from(map.values()).map(s => {
      const totalHours = Number((s.totalMinutes / 60).toFixed(2));
      const completionRate = s.totalWorks > 0 ? Math.round((s.completedWorks / s.totalWorks) * 100) : 0;
      
      // Average hours per completed work (or per submitted if no completed yet)
      const divisor = s.completedWorks > 0 ? s.completedWorks : (s.submittedWorks > 0 ? s.submittedWorks : (s.totalWorks > 0 ? s.totalWorks : 1));
      const averageHours = Number((totalHours / divisor).toFixed(2));

      return {
        ...s,
        totalHours,
        averageHours,
        completionRate
      };
    });

    // Filter by search query & department
    return list.filter(s => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchUser = s.username.toLowerCase().includes(q);
        const matchDept = s.department.toLowerCase().includes(q);
        if (!matchName && !matchUser && !matchDept) return false;
      }
      if (deptFilter !== 'ALL') {
        if (!s.department.toLowerCase().includes(deptFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [members, filteredTasks, searchQuery, deptFilter]);

  // Sort ranked student list
  const rankedStudents = useMemo(() => {
    return [...studentMetrics].sort((a, b) => {
      switch (sortBy) {
        case 'COMPLETED_WORKS':
          return b.completedWorks - a.completedWorks || b.totalHours - a.totalHours;
        case 'TOTAL_WORKS':
          return b.totalWorks - a.totalWorks || b.completedWorks - a.completedWorks;
        case 'AVERAGE_HOURS':
          return b.averageHours - a.averageHours || b.totalHours - a.totalHours;
        case 'COMPLETION_RATE':
          return b.completionRate - a.completionRate || b.completedWorks - a.completedWorks;
        case 'TOTAL_HOURS':
        default:
          return b.totalHours - a.totalHours || b.completedWorks - a.completedWorks;
      }
    });
  }, [studentMetrics, sortBy]);

  // Overall chapter analytics totals
  const overallStats = useMemo(() => {
    const totalAssignedWorks = filteredTasks.length;
    const totalCompletedWorks = filteredTasks.filter(t => t.status === WORK_STATUSES.COMPLETED).length;
    const totalSubmittedWorks = filteredTasks.filter(t => 
      t.status === WORK_STATUSES.COMPLETED || 
      t.status === WORK_STATUSES.PENDING_FIRST_LEVEL || 
      t.status === WORK_STATUSES.PENDING_FINAL || 
      t.status === WORK_STATUSES.SUBMITTED
    ).length;
    const pendingWorks = totalAssignedWorks - totalCompletedWorks;

    let totalChapterMinutes = 0;
    filteredTasks.forEach(t => {
      if (Array.isArray(t.progressHistory)) {
        t.progressHistory.forEach(h => totalChapterMinutes += (Number(h.totalMinutes) || 0));
      } else if (t.totalMinutesWorked) {
        totalChapterMinutes += Number(t.totalMinutesWorked) || 0;
      }
    });

    const totalHours = Number((totalChapterMinutes / 60).toFixed(2));
    const avgHoursPerSubmitted = totalSubmittedWorks > 0 ? Number((totalHours / totalSubmittedWorks).toFixed(2)) : 0;
    const avgHoursPerCompleted = totalCompletedWorks > 0 ? Number((totalHours / totalCompletedWorks).toFixed(2)) : 0;
    const chapterCompletionRate = totalAssignedWorks > 0 ? Math.round((totalCompletedWorks / totalAssignedWorks) * 100) : 0;

    return {
      totalAssignedWorks,
      totalSubmittedWorks,
      totalCompletedWorks,
      pendingWorks,
      totalHours,
      avgHoursPerSubmitted,
      avgHoursPerCompleted,
      chapterCompletionRate
    };
  }, [filteredTasks]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set();
    members.forEach(m => {
      if (m?.department) set.add(m.department.split('/')[0].trim());
    });
    return Array.from(set);
  }, [members]);

  return (
    <div className="space-y-6">
      {/* Page Title & Authorized Access Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-iei-navy-950 text-amber-400 flex items-center justify-center font-bold shadow-sm">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-serif text-iei-navy-950 tracking-tight">
                  STUDENTS WORK ANALYTICS
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Admin &amp; Staff Access Only
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official ranking, productivity metrics, and work duration audit for IEI MGR Student Chapter members
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Logged in as:</span>
            <span className="font-bold text-iei-navy-950 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200">
              {currentUser?.name} ({currentUser?.role})
            </span>
          </div>
        </div>

        {/* 8 Primary Calculated Analytics Figures */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              1. Total Assigned Works
            </span>
            <span className="text-2xl font-black text-iei-navy-950 mt-1 block">
              {overallStats.totalAssignedWorks}
            </span>
            <span className="text-[10px] text-slate-400">All dispatched tasks</span>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200">
            <span className="text-[10px] uppercase font-bold text-blue-700 block tracking-wider">
              2. Total Submitted Works
            </span>
            <span className="text-2xl font-black text-blue-950 mt-1 block">
              {overallStats.totalSubmittedWorks}
            </span>
            <span className="text-[10px] text-blue-600">Reports submitted by students</span>
          </div>

          <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
              3. Total Completed Works
            </span>
            <span className="text-2xl font-black text-emerald-950 mt-1 block">
              {overallStats.totalCompletedWorks}
            </span>
            <span className="text-[10px] text-emerald-600">Admin/Staff approved only</span>
          </div>

          <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-700 block tracking-wider">
              4. Pending Works
            </span>
            <span className="text-2xl font-black text-amber-950 mt-1 block">
              {overallStats.pendingWorks}
            </span>
            <span className="text-[10px] text-amber-600">In progress / pending review</span>
          </div>

          <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200">
            <span className="text-[10px] uppercase font-bold text-purple-700 block tracking-wider">
              5. Total Recorded Hours
            </span>
            <span className="text-2xl font-black text-purple-950 font-mono mt-1 block">
              {overallStats.totalHours} hrs
            </span>
            <span className="text-[10px] text-purple-600">Sum of valid student durations</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
              6. Avg. Hours / Submitted
            </span>
            <span className="text-2xl font-black text-slate-800 font-mono mt-1 block">
              {overallStats.avgHoursPerSubmitted}
            </span>
            <span className="text-[10px] text-slate-400">Hours per submitted report</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
              7. Avg. Hours / Completed
            </span>
            <span className="text-2xl font-black text-slate-800 font-mono mt-1 block">
              {overallStats.avgHoursPerCompleted}
            </span>
            <span className="text-[10px] text-slate-400">Hours per approved completion</span>
          </div>

          <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
              8. Completion Rate
            </span>
            <span className="text-2xl font-black text-emerald-950 font-mono mt-1 block">
              {overallStats.chapterCompletionRate}%
            </span>
            <span className="text-[10px] text-emerald-600">Completed vs Assigned</span>
          </div>
        </div>
      </div>

      {/* Filters and Controls Toolbar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Time Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Time Range:</span>
            {[
              { id: 'ALL', label: 'All-Time' },
              { id: 'WEEKLY', label: 'Past 7 Days' },
              { id: 'MONTHLY', label: 'Past 30 Days' },
              { id: 'CUSTOM', label: 'Custom Range' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setTimeFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  timeFilter === f.id
                    ? 'bg-iei-navy-950 text-amber-400 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-semibold">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-iei-navy-950 focus:outline-none focus:ring-1 focus:ring-iei-navy-900"
            >
              <option value="TOTAL_HOURS">Total Working Hours</option>
              <option value="COMPLETED_WORKS">Completed Works</option>
              <option value="TOTAL_WORKS">Total Assigned Works</option>
              <option value="AVERAGE_HOURS">Average Hours</option>
              <option value="COMPLETION_RATE">Completion Rate (%)</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {timeFilter === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-bold">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-bold">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        )}

        {/* Student Search & Department Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student by name, username or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-iei-navy-900 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Departments &amp; Units</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Student Work Ranking Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-iei-navy-950 uppercase tracking-wide">
              Student Work Performance Ranking
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked dynamically based on recorded work performance and Admin-approved submissions ({rankedStudents.length} students)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200/80 tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4 text-center">Total Works</th>
                <th className="py-3.5 px-4 text-center">Completed Works</th>
                <th className="py-3.5 px-4 text-center">Total Hours</th>
                <th className="py-3.5 px-4 text-center">Average Hours</th>
                <th className="py-3.5 px-4 text-center">Completion Rate</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rankedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    No student records matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                rankedStudents.map((student, index) => {
                  const rank = index + 1;
                  const isTop3 = rank <= 3 && student.completedWorks > 0;

                  return (
                    <tr 
                      key={student.id} 
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      onClick={() => setSelectedStudentForReport(student)}
                    >
                      {/* Rank Indicator */}
                      <td className="py-3.5 px-4 text-center">
                        {isTop3 ? (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs shadow-xs ${
                            rank === 1 
                              ? 'bg-amber-400 text-iei-navy-950 border border-amber-300' 
                              : rank === 2 
                                ? 'bg-slate-200 text-slate-800 border border-slate-300' 
                                : 'bg-amber-700 text-white border border-amber-600'
                          }`}>
                            {rank}
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-slate-400">
                            #{rank}
                          </span>
                        )}
                      </td>

                      {/* Student Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=0B2545&color=fff`}
                            alt={student.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                          <div className="truncate">
                            <span className="font-bold text-iei-navy-950 block truncate group-hover:text-iei-gold-700 transition-colors">
                              {student.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              @{student.username} &bull; {student.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total Works */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 font-mono">
                        {student.totalWorks}
                      </td>

                      {/* Completed Works */}
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-700 font-mono">
                        {student.completedWorks}
                      </td>

                      {/* Total Hours */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-purple-900">
                        {student.totalHours} hrs
                      </td>

                      {/* Average Hours */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-700">
                        {student.averageHours}
                      </td>

                      {/* Completion Rate */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 font-bold font-mono text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span>{student.completionRate}%</span>
                        </div>
                      </td>

                      {/* View Report Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudentForReport(student);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-iei-navy-950 hover:text-amber-400 text-iei-navy-950 font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Report</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Student Report Modal */}
      {selectedStudentForReport && (
        <Modal
          isOpen={!!selectedStudentForReport}
          onClose={() => setSelectedStudentForReport(null)}
          title={`Student Performance Report: ${selectedStudentForReport.name}`}
        >
          <div className="space-y-5 text-xs max-h-[80vh] overflow-y-auto pr-1">
            {/* Student Profile Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedStudentForReport.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudentForReport.name)}&background=0B2545&color=fff`}
                  alt={selectedStudentForReport.name}
                  className="w-14 h-14 rounded-full object-cover border border-slate-300 shadow-sm"
                />
                <div>
                  <h3 className="text-base font-bold text-iei-navy-950">
                    {selectedStudentForReport.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="px-2 py-0.5 rounded bg-iei-navy-900 text-amber-400 font-bold text-[10px]">
                      {selectedStudentForReport.role}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {selectedStudentForReport.department}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {selectedStudentForReport.membershipId}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    <span>{selectedStudentForReport.email}</span> &bull; <span>{selectedStudentForReport.phone || 'Phone N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Stats Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Tasks</span>
                <span className="text-lg font-black text-iei-navy-950 mt-0.5 block">{selectedStudentForReport.totalWorks}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Admin Approved</span>
                <span className="text-lg font-black text-emerald-900 mt-0.5 block">{selectedStudentForReport.completedWorks}</span>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <span className="text-[10px] uppercase font-bold text-purple-700 block">Total Hours</span>
                <span className="text-lg font-black text-purple-950 font-mono mt-0.5 block">{selectedStudentForReport.totalHours} hrs</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">Avg. Hours / Task</span>
                <span className="text-lg font-black text-amber-950 font-mono mt-0.5 block">{selectedStudentForReport.averageHours}</span>
              </div>
            </div>

            {/* Assigned Tasks Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-iei-navy-950 uppercase tracking-wider flex items-center justify-between">
                <span>Assigned Tasks Register ({selectedStudentForReport.assignedTasks.length})</span>
                <span className="text-[10px] text-slate-400 normal-case font-medium">Distinct work items</span>
              </h4>

              {selectedStudentForReport.assignedTasks.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-100">
                  No tasks assigned to this student yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedStudentForReport.assignedTasks.map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === WORK_STATUSES.COMPLETED 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {t.status}
                          </span>
                          <span className="font-bold text-iei-navy-950 text-xs">{t.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{t.description}</p>
                      </div>
                      <div className="text-right shrink-0 text-[11px] font-mono text-slate-600">
                        <div>Duration: <strong>{t.totalHoursWorked || 0} hrs</strong></div>
                        <div className="text-[10px] text-slate-400">Progress: {t.progress || 0}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submission History & Uploaded Evidence */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-iei-navy-950 uppercase tracking-wider">
                Work Submissions &amp; Uploaded Evidence ({selectedStudentForReport.historyEntries.length} logs)
              </h4>

              {selectedStudentForReport.historyEntries.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-100">
                  No work progress updates or evidence uploaded yet by this student.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedStudentForReport.historyEntries.map((log, lIdx) => (
                    <div key={lIdx} className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-iei-navy-950">{log.taskTitle || 'Task Work Update'}</span>
                        <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                          {log.hoursWorked || 0}h {log.minutesWorked || 0}m logged
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        <span>Work Date: {log.workDate || 'N/A'}</span> &bull; <span>Progress: {log.progressPercentage}%</span>
                      </div>
                      {log.description && (
                        <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg leading-relaxed">
                          {log.description}
                        </p>
                      )}

                      {/* Evidence Files */}
                      {Array.isArray(log.attachments) && log.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {log.attachments.map((att, aIdx) => (
                            <a
                              key={aIdx}
                              href={att.url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-iei-navy-950 font-medium text-[10px] border border-slate-200"
                            >
                              <FileText className="w-3 h-3 text-rose-600" />
                              <span className="truncate max-w-[140px]">{att.name}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentForReport(null)}
                className="px-4 py-2 rounded-xl bg-iei-navy-950 text-white font-bold text-xs hover:bg-slate-900 cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
