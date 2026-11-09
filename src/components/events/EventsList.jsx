import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  Search, 
  FileCheck2, 
  CalendarCheck,
  ArrowRight
} from 'lucide-react';
import { canManageEvents, canRecordAttendance } from '../../config/roles';
import { EventFormModal } from './EventFormModal';

export function EventsList({ events = [], onNavigateToAttendance }) {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('upcoming'); // 'upcoming', 'completed', 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canCreate = canManageEvents(currentUser?.role);
  const canRecord = canRecordAttendance(currentUser?.role);

  const filteredEvents = events.filter((ev) => {
    if (tab === 'upcoming' && !ev.isUpcoming) return false;
    if (tab === 'completed' && ev.isUpcoming) return false;

    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 text-iei-gold-700 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Institutional Calendar</span>
            </div>
            <h2 className="text-xl font-bold text-iei-navy-950 mt-0.5">
              Chapter Events & Technical Programs
            </h2>
            <p className="text-xs text-slate-500">
              National symposiums, statutory committee meetings, guest lectures, and student workshops.
            </p>
          </div>

          {canCreate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-iei-navy-900 hover:bg-iei-navy-800 text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-iei-gold-400" />
              <span>Schedule Meeting / Event</span>
            </button>
          )}
        </div>

        {/* Tabs and Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setTab('upcoming')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === 'upcoming'
                  ? 'bg-iei-navy-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Upcoming ({events.filter((e) => e.isUpcoming).length})
            </button>
            <button
              onClick={() => setTab('completed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === 'completed'
                  ? 'bg-iei-navy-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Past / Completed ({events.filter((e) => !e.isUpcoming).length})
            </button>
            <button
              onClick={() => setTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === 'all'
                  ? 'bg-iei-navy-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Events ({events.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, venue..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
            />
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No events found in this view</h4>
            <p className="text-xs text-slate-400 mt-1">
              Chairmen, Secretaries, and Event Coordinators can schedule official chapter meetings and technical programs.
            </p>
            {canCreate && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-iei-navy-900 hover:bg-iei-navy-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-iei-gold-400" />
                <span>Schedule Chapter Meeting / Event</span>
              </button>
            )}
          </div>
        ) : (
          filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              {ev.posterUrl && (
                <div className="h-44 w-full bg-slate-900 overflow-hidden relative">
                  <img
                    src={ev.posterUrl}
                    alt={ev.title}
                    className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                    {ev.category}
                  </span>
                </div>
              )}

              <div className="p-5 flex-1">
                {!ev.posterUrl && (
                  <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 mb-2">
                    {ev.category}
                  </span>
                )}

                <h3 className="text-base font-bold text-iei-navy-950">
                  {ev.title}
                </h3>

                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {ev.description}
                </p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-iei-navy-600 shrink-0" />
                    <span className="font-semibold text-slate-800">{ev.date}</span>
                    <span>• {ev.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{ev.venue}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Attendance Connection */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                {ev.hasAttendanceRecord ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                    Attendance Sealed
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    No attendance filed
                  </span>
                )}

                {canRecord && (
                  <button
                    onClick={() => onNavigateToAttendance && onNavigateToAttendance(ev)}
                    className="inline-flex items-center gap-1 font-bold text-iei-navy-700 hover:text-iei-navy-900 hover:underline"
                  >
                    <span>{ev.hasAttendanceRecord ? 'View Attendance' : 'Take Attendance'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <EventFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
