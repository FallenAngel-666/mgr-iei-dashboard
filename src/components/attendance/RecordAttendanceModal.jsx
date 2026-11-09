import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { recordEventAttendance } from '../../services/firebaseService';
import { CalendarCheck, Paperclip, AlertCircle, ShieldCheck } from 'lucide-react';

export function RecordAttendanceModal({ isOpen, onClose, events = [], members = [], onRecorded }) {
  const { currentUser } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [notes, setNotes] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [memberStatuses, setMemberStatuses] = useState(() => {
    const initial = {};
    members.forEach((m) => {
      initial[m.id] = 'Present';
    });
    return initial;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const eligibleEvents = events;

  const handleStatusChange = (memberId, status) => {
    setMemberStatuses((prev) => ({
      ...prev,
      [memberId]: status
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !currentUser) {
      setError('Please select an official committee meeting or chapter event.');
      return;
    }

    const event = events.find((ev) => ev.id === selectedEventId);
    if (!event) return;

    setLoading(true);
    setError(null);
    try {
      const records = members.map((m) => ({
        memberId: m.id,
        name: m.name,
        role: m.role,
        status: memberStatuses[m.id] || 'Present'
      }));

      const newAtt = await recordEventAttendance({
        eventId: event.id,
        eventTitle: event.title,
        category: event.category,
        date: event.date || new Date().toISOString().split('T')[0],
        recordedBy: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role
        },
        notes: notes.trim(),
        documentUrl: documentUrl.trim() || null,
        records
      });

      setLoading(false);
      if (onRecorded) onRecorded(newAtt);
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Record Committee Meeting / Event Attendance"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Strict Scope Alert */}
        <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <strong>Institutional Attendance Scope:</strong> In accordance with IEI regulations, attendance tracking is strictly restricted to official Committee Meetings and scheduled Chapter Events. Daily or routine classroom attendance is disabled.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Meeting/Event Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Associate with Official Committee Meeting or Event *
          </label>
          <select
            required
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 bg-white"
          >
            <option value="">-- Choose scheduled meeting or event --</option>
            {eligibleEvents.map((ev) => (
              <option key={ev.id} value={ev.id}>
                [{ev.category}] {ev.title} — {ev.date}
              </option>
            ))}
          </select>
        </div>

        {/* Member Attendance Roster Table */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Committee Attendance Roll Call ({members.length} Members)
          </label>
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2 px-3 font-bold">Member Name & Role</th>
                  <th className="py-2 px-3 font-bold text-center">Present</th>
                  <th className="py-2 px-3 font-bold text-center">Absent</th>
                  <th className="py-2 px-3 font-bold text-center">Excused</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => {
                  const currentStatus = memberStatuses[m.id] || 'Present';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-iei-navy-950 block">{m.name}</span>
                        <span className="text-[10px] text-slate-500">{m.role}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="radio"
                          name={`status-${m.id}`}
                          checked={currentStatus === 'Present'}
                          onChange={() => handleStatusChange(m.id, 'Present')}
                          className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="radio"
                          name={`status-${m.id}`}
                          checked={currentStatus === 'Absent'}
                          onChange={() => handleStatusChange(m.id, 'Absent')}
                          className="text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="radio"
                          name={`status-${m.id}`}
                          checked={currentStatus === 'Excused'}
                          onChange={() => handleStatusChange(m.id, 'Excused')}
                          className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Meeting Notes and Document Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Official Minutes / Deliberation Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Summary of decisions taken, motions passed, or matters arising..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Signed Attendance Sheet Filename (Optional)
            </label>
            <input
              type="text"
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              placeholder="e.g. Signed_Sheet_ECM_10Nov2026.pdf"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Preserved in Chapter digital archives.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedEventId}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-iei-navy-900 hover:bg-iei-navy-800 text-white rounded-lg shadow-sm disabled:opacity-50"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-iei-gold-400" />
            <span>{loading ? 'Recording...' : 'Save Official Attendance'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
