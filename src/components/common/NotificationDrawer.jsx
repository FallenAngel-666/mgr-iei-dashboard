import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  ShieldAlert, 
  FileCheck2, 
  AlertCircle, 
  Calendar, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export function NotificationDrawer({ isOpen, onClose, onNavigateToItem }) {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'approvals'

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'approvals') {
      return (
        n.type === 'pending_first_level_review' ||
        n.type === 'pending_final_approval' ||
        n.type === 'first_level_approved' ||
        n.type === 'final_approval' ||
        n.type === 'rejection'
      );
    }
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'pending_first_level_review':
      case 'pending_final_approval':
        return <ShieldAlert className="w-5 h-5 text-amber-600" />;
      case 'final_approval':
      case 'first_level_approved':
        return <FileCheck2 className="w-5 h-5 text-emerald-600" />;
      case 'rejection':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      case 'event':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'community_update':
        return <MessageSquare className="w-5 h-5 text-indigo-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-iei-navy-100 text-iei-navy-800">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-iei-navy-900">Notifications</h2>
                <p className="text-xs text-slate-500">
                  {unreadCount > 0 ? `${unreadCount} unread notices` : 'All caught up'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-semibold text-iei-navy-700 hover:text-iei-navy-900 flex items-center gap-1 px-2 py-1 rounded bg-slate-200/60 hover:bg-slate-200 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all notices?')) {
                      clearAll();
                    }
                  }}
                  className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1 px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 cursor-pointer"
                  title="Clear all notifications"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 cursor-pointer ml-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-200 bg-white px-4 pt-2 gap-2 text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`pb-2 px-3 border-b-2 transition-colors ${
                filter === 'all'
                  ? 'border-iei-navy-700 text-iei-navy-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`pb-2 px-3 border-b-2 transition-colors ${
                filter === 'unread'
                  ? 'border-iei-navy-700 text-iei-navy-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('approvals')}
              className={`pb-2 px-3 border-b-2 transition-colors ${
                filter === 'approvals'
                  ? 'border-iei-navy-700 text-iei-navy-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Approvals & Tasks
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-700">No notifications found</h4>
                <p className="text-xs text-slate-400 mt-1">
                  You will receive individual notifications here for assigned tasks, report approvals, and chapter updates.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markRead(notif.id);
                    if (onNavigateToItem && notif.linkId) {
                      onNavigateToItem(notif);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl transition-all cursor-pointer mb-1.5 flex gap-3 ${
                    notif.read
                      ? 'bg-white hover:bg-slate-50 opacity-80'
                      : 'bg-blue-50/70 border border-blue-200/80 shadow-xs'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    <div className="p-2 rounded-lg bg-white shadow-xs border border-slate-200">
                      {getIcon(notif.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className={`text-xs ${notif.read ? 'font-medium text-slate-800' : 'font-bold text-iei-navy-950'}`}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1 text-[11px] text-slate-400">
                      <span>
                        {notif.date ? formatDistanceToNow(new Date(notif.date), { addSuffix: true }) : 'Recently'}
                      </span>
                      {notif.linkId && (
                        <span className="inline-flex items-center gap-0.5 text-iei-navy-700 font-semibold hover:underline">
                          View details <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
