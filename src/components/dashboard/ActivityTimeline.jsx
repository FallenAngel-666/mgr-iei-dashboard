import React from 'react';
import { 
  Calendar, 
  Megaphone, 
  MessagesSquare, 
  ArrowRight,
  Clock,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ActivityTimeline({ events = [], announcements = [], updates = [], onNavigateToTab }) {
  const upcomingEvents = events.filter((e) => e.isUpcoming).slice(0, 3);
  const recentAnnouncements = announcements.slice(0, 3);
  const recentUpdates = updates.slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Upcoming Events Column */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-iei-navy-700" />
            <h3 className="text-sm font-bold text-iei-navy-950">Upcoming Events</h3>
          </div>
          <button
            onClick={() => onNavigateToTab('events')}
            className="text-xs font-semibold text-iei-navy-700 hover:underline flex items-center gap-0.5"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {upcomingEvents.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No upcoming events scheduled</p>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((evt) => (
              <div key={evt.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 mb-1">
                  {evt.category}
                </span>
                <h4 className="text-xs font-bold text-iei-navy-950 line-clamp-1">
                  {evt.title}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{evt.date} • {evt.time}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{evt.venue}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official Announcements Column */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-iei-gold-600" />
            <h3 className="text-sm font-bold text-iei-navy-950">Announcements</h3>
          </div>
          <button
            onClick={() => onNavigateToTab('announcements')}
            className="text-xs font-semibold text-iei-navy-700 hover:underline flex items-center gap-0.5"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentAnnouncements.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No announcements published</p>
        ) : (
          <div className="space-y-3">
            {recentAnnouncements.map((ann) => (
              <div key={ann.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ann.priority === 'Urgent' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {ann.priority}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {ann.publishedAt ? formatDistanceToNow(new Date(ann.publishedAt), { addSuffix: true }) : ''}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-iei-navy-950 line-clamp-1">
                  {ann.title}
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Community Feed Sneak Peek Column */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MessagesSquare className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-iei-navy-950">Community Feed</h3>
          </div>
          <button
            onClick={() => onNavigateToTab('community')}
            className="text-xs font-semibold text-iei-navy-700 hover:underline flex items-center gap-0.5"
          >
            Open Feed <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentUpdates.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No community posts yet</p>
        ) : (
          <div className="space-y-3">
            {recentUpdates.map((upd) => (
              <div key={upd.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-bold text-iei-navy-900">{upd.authorName}</span>
                  <span className="text-slate-400 text-[10px]">
                    {upd.timestamp ? formatDistanceToNow(new Date(upd.timestamp), { addSuffix: true }) : ''}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  {upd.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
