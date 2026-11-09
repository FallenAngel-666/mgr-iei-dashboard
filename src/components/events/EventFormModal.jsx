import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { createEvent } from '../../services/firebaseService';
import { Calendar, Clock, MapPin, Image as ImageIcon } from 'lucide-react';

export function EventFormModal({ isOpen, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technical Symposium');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setLoading(true);
    try {
      const newEvt = await createEvent({
        title: title.trim(),
        category,
        date,
        time: time.trim() || '09:30 AM - 04:30 PM',
        venue: venue.trim() || 'Dr. M.G.R. DU Campus Auditorium',
        description: description.trim(),
        posterUrl: posterUrl.trim() || null
      });

      setTitle('');
      setDate('');
      setTime('');
      setVenue('');
      setDescription('');
      setPosterUrl('');
      setLoading(false);
      if (onCreated) onCreated(newEvt);
      onClose();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Official Chapter Event / Meeting">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Event Title *
          </label>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. TECHNOVATION 2026 or Executive Committee Strategy Meeting"
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Event Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="Technical Symposium">Technical Symposium</option>
              <option value="Committee Meeting">Committee Meeting</option>
              <option value="Hands-on Workshop">Hands-on Workshop</option>
              <option value="Industrial Guest Lecture">Industrial Guest Lecture</option>
              <option value="Industrial Visit">Industrial Visit</option>
              <option value="Student Orientation">Student Orientation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Event Date *
            </label>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Timing / Duration
            </label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g. 09:30 AM - 04:30 PM"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Venue / Location
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Anna Block Main Auditorium"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Event Description & Objectives
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline agenda, target audience, keynote speakers, and accreditation relevance..."
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Poster / Banner URL (Optional)
          </label>
          <input
            type="url"
            value={posterUrl}
            onChange={(e) => setPosterUrl(e.target.value)}
            placeholder="https://example.com/poster.jpg"
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
          />
        </div>

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
            disabled={loading}
            className="px-4 py-2 text-xs font-bold bg-iei-navy-900 hover:bg-iei-navy-800 text-white rounded-lg shadow-sm"
          >
            {loading ? 'Creating...' : 'Schedule Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
