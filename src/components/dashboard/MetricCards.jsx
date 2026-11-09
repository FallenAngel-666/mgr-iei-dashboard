import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  AlertCircle, 
  Calendar,
  Briefcase
} from 'lucide-react';
import { WORK_STATUSES, canAccessMembersDirectory } from '../../config/roles';
import { useAuth } from '../../context/AuthContext';

export function MetricCards({ members = [], tasks = [], events = [], onNavigateToTab }) {
  const { currentUser } = useAuth();
  const totalMembers = members.length;
  const totalTasks = tasks.length;

  // Strict rule: only marked Completed with final Staff Coordinator approval
  const completedTasks = tasks.filter((t) => t.status === WORK_STATUSES.COMPLETED).length;

  const awaitingApproval = tasks.filter(
    (t) => t.status === WORK_STATUSES.PENDING_FIRST_LEVEL || t.status === WORK_STATUSES.PENDING_FINAL
  ).length;

  const pendingWork = tasks.filter(
    (t) => t.status === WORK_STATUSES.ASSIGNED || t.status === WORK_STATUSES.IN_PROGRESS
  ).length;

  const rejectedWork = tasks.filter((t) => t.status === WORK_STATUSES.REJECTED).length;

  const upcomingEvents = events.filter((e) => e.isUpcoming).length;

  const cards = [
    {
      title: 'Total Members',
      value: totalMembers,
      subtitle: 'Official IEI Committee & Leads',
      icon: Users,
      color: 'border-l-blue-500 text-blue-600 bg-blue-50/50',
      tab: 'members'
    },
    {
      title: 'Total Assigned Work',
      value: totalTasks,
      subtitle: 'Chapter initiatives & tasks',
      icon: Briefcase,
      color: 'border-l-slate-600 text-slate-700 bg-slate-50/60',
      tab: 'tasks'
    },
    {
      title: 'Awaiting Approval',
      value: awaitingApproval,
      subtitle: '1st-Level & Final Coordinator',
      icon: ShieldAlert,
      color: 'border-l-amber-500 text-amber-600 bg-amber-50/50',
      tab: 'approvals',
      highlight: awaitingApproval > 0
    },
    {
      title: 'Officially Completed',
      value: completedTasks,
      subtitle: 'Staff Coordinator Approved',
      icon: CheckCircle2,
      color: 'border-l-emerald-500 text-emerald-600 bg-emerald-50/50',
      tab: 'tasks'
    },
    {
      title: 'Pending / In Progress',
      value: pendingWork,
      subtitle: 'Ongoing committee assignments',
      icon: Clock,
      color: 'border-l-indigo-500 text-indigo-600 bg-indigo-50/50',
      tab: 'tasks'
    },
    {
      title: 'Rejected / Revision',
      value: rejectedWork,
      subtitle: 'Requires resubmission',
      icon: AlertCircle,
      color: 'border-l-rose-500 text-rose-600 bg-rose-50/50',
      tab: 'tasks'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        const isRestrictedTab = c.tab === 'members' && !canAccessMembersDirectory(currentUser);
        return (
          <div
            key={i}
            onClick={() => {
              if (isRestrictedTab) return;
              if (onNavigateToTab) onNavigateToTab(c.tab);
            }}
            className={`p-4 rounded-xl bg-white border border-slate-200 border-l-4 shadow-xs transition-all ${
              isRestrictedTab ? 'cursor-default opacity-85' : 'hover:shadow-md cursor-pointer'
            } ${c.color}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                {c.title}
              </span>
              <Icon className="w-4 h-4 shrink-0" />
            </div>
            <div className="text-2xl font-black text-iei-navy-950">
              {c.value}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 truncate">
              {c.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
