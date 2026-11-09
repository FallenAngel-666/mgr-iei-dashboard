import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  ShieldAlert, 
  ShieldCheck, 
  HelpCircle 
} from 'lucide-react';
import { WORK_STATUSES } from '../../config/roles';

export function StatusBadge({ status, size = 'sm' }) {
  const sizeClasses = size === 'xs' 
    ? 'px-2 py-0.5 text-xs' 
    : size === 'md' 
    ? 'px-3 py-1.5 text-sm font-semibold' 
    : 'px-2.5 py-1 text-xs font-medium';

  switch (status) {
    case WORK_STATUSES.ASSIGNED:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Assigned</span>
        </span>
      );

    case WORK_STATUSES.IN_PROGRESS:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          <span>In Progress</span>
        </span>
      );

    case WORK_STATUSES.SUBMITTED:
    case WORK_STATUSES.PENDING_FIRST_LEVEL:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>Pending 1st-Level Approval</span>
        </span>
      );

    case WORK_STATUSES.PENDING_FINAL:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-purple-50 text-purple-800 border border-purple-300 ${sizeClasses}`}>
          <Send className="w-3.5 h-3.5 text-purple-600" />
          <span>Pending Final Staff Approval</span>
        </span>
      );

    case WORK_STATUSES.COMPLETED:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Completed</span>
        </span>
      );

    case WORK_STATUSES.REJECTED:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300 ${sizeClasses}`}>
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Rejected / Needs Revision</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>{status || 'Unknown'}</span>
        </span>
      );
  }
}
