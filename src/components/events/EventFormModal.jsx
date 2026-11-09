import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { createEvent } from '../../services/firebaseService';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  MessagesSquare, 
  Megaphone, 
  CheckCircle2, 
  Users,
  Sparkles
} from 'lucide-react';

export function EventFormModal({ isOpen, onClose, onCreated }) {
  const { currentUser } = useAuth();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Statutory Committee Meeting');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:30');
  const [endTime, setEndTime] = useState('12:00');
  const [venue, setVenue] = useState('Mechanical Seminar Hall (Ground Floor)');
  const [description, setDescription] = useState('');
  const [attendeesGroup, setAttendeesGroup] = useState('All Committee Members (23 Accounts)');
  
  // Auto-broadcast toggles
  const [broadcastToChat, setBroadcastToChat] = useState(true);
  const [broadcastToCircular, setBroadcastToCircular] = useState(true);
  
  const [loading, setLoading] = useState(false);

  // Helper to format 24-hr time to 12-hr format (e.g., 10:30 -> 10:30 AM)
  const formatTime12h = (t24) => {
    if (!t24) return '';
    const [h, m] = t24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  const formattedClockRange = startTime && endTime 
    ? `${formatTime12h(startTime)} - ${formatTime12h(endTime)}`
    : startTime 
    ? formatTime12h(startTime) 
    : '10:30 AM - 12:00 PM';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setLoading(true);
    try {
      const author = currentUser || {
        name: 'Chapter Directorate',
        role: 'Joint Secretary'
      };

      const newEvt = await createEvent(
        {
          title: title.trim(),
          category,
          date,
          time: formattedClockRange,
          startTime,
          endTime,
          venue: venue.trim() || 'Dr. M.G.R. DU Campus, Chennai',
          description: description.trim(),
          attendeesGroup,
          broadcastToChat,
          broadcastToCircular,
          scheduledByName: author.name,
          scheduledByRole: author.role
        },
        author
      );

      // Reset fields
      setTitle('');
      setDate('');
      setStartTime('10:30');
      setEndTime('12:00');
      setVenue('Mechanical Seminar Hall (Ground Floor)');
      setDescription('');
      setLoading(false);
      
      if (onCreated) onCreated(newEvt);
      onClose();
    } catch (err) {
      console.error('Error creating event:', err);
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Chapter Meeting or Event">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Meeting Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Meeting / Event Title *
          </label>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Executive Committee Review & Technical Symposium Strategy"
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500 font-medium"
          />
        </div>

        {/* Category & Attendees */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Meeting Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
            >
              <option value="Statutory Committee Meeting">Statutory Committee Meeting</option>
              <option value="Executive Body Meeting">Executive Body Meeting</option>
              <option value="Urgent Chapter Briefing">Urgent Chapter Briefing</option>
              <option value="Technical Symposium">Technical Symposium</option>
              <option value="Hands-on Workshop">Hands-on Workshop</option>
              <option value="Industrial Guest Lecture">Industrial Guest Lecture</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Required Attendees
            </label>
            <select
              value={attendeesGroup}
              onChange={(e) => setAttendeesGroup(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
            >
              <option value="All Committee Members (23 Accounts)">All Committee Members & Officers</option>
              <option value="Office Bearers Only (Chairmen, Secretaries, Treasurers)">Office Bearers Only</option>
              <option value="Executive Members Only">Executive Members Only</option>
              <option value="Technical & Event Core Team">Technical & Event Core Team</option>
            </select>
          </div>
        </div>

        {/* Calendar Date Picker & Clock Time Picker */}
        <div className="p-3.5 bg-gradient-to-r from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-iei-navy-700" />
            <span className="text-xs font-bold text-iei-navy-950">
              Meeting Schedule: Date &amp; Clock Timing
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Calendar Date Picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Calendar Date *
              </label>
              <div className="relative">
                <input
                  required
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
                />
              </div>
            </div>

            {/* Clock Start Time */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Clock Start Time *
              </label>
              <div className="relative">
                <input
                  required
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
                />
              </div>
            </div>

            {/* Clock End Time */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Clock End Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Formatted Schedule Preview Pill */}
          {date && (
            <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-blue-100/70 border border-blue-200 flex items-center justify-between text-[11px] text-blue-900 font-semibold">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-700" />
                <span>Scheduled for: {date} at {formattedClockRange}</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-blue-800">Confirmed Slot</span>
            </div>
          )}
        </div>

        {/* Venue / Location */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Meeting Venue / Location *
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              required
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Mechanical Seminar Hall, Ground Floor, Anna Block"
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 font-medium"
            />
          </div>
        </div>

        {/* Description / Agenda */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Meeting Agenda &amp; Discussion Points
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline agenda items, tasks to be reviewed, preparation required by committee members..."
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 resize-none font-medium"
          />
        </div>

        {/* Automated Broadcast Options (Updates Chat Box & Circular Announcement) */}
        <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Automated Notification &amp; Broadcasting</span>
          </div>
          <p className="text-[11px] text-amber-800">
            When scheduled, this meeting will be automatically published across the chapter channels:
          </p>

          <div className="space-y-1.5 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={broadcastToChat}
                onChange={(e) => setBroadcastToChat(e.target.checked)}
                className="w-4 h-4 rounded text-iei-navy-900 border-slate-300 focus:ring-iei-navy-500"
              />
              <span className="flex items-center gap-1.5">
                <MessagesSquare className="w-3.5 h-3.5 text-iei-navy-700" />
                <span>Publish to <strong>Community Updates Feed (Chat Box)</strong></span>
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={broadcastToCircular}
                onChange={(e) => setBroadcastToCircular(e.target.checked)}
                className="w-4 h-4 rounded text-iei-navy-900 border-slate-300 focus:ring-iei-navy-500"
              />
              <span className="flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-amber-700" />
                <span>Issue as Official <strong>Circular Announcement</strong></span>
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-xs font-bold bg-iei-navy-900 hover:bg-iei-navy-800 text-white rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Calendar className="w-4 h-4 text-iei-gold-400" />
            <span>{loading ? 'Scheduling...' : 'Schedule Official Meeting'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
