import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { createTask } from '../../services/firebaseService';
import { Briefcase, User, Calendar, AlertCircle } from 'lucide-react';

export function AssignTaskModal({ isOpen, onClose, members = [] }) {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('High');
  const [weeklyTag, setWeeklyTag] = useState('2026-W45');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !assignedToId || !currentUser) return;

    const assignedUser = members.find((m) => m.id === assignedToId);
    if (!assignedUser) return;

    setLoading(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        assignedToId: assignedUser.id,
        assignedToName: assignedUser.name,
        assignedToRole: assignedUser.role,
        assignedById: currentUser.id,
        assignedByName: currentUser.name,
        assignedByRole: currentUser.role,
        assignedDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate || null,
        priority,
        weeklyTag
      });

      setTitle('');
      setDescription('');
      setAssignedToId('');
      setDueDate('');
      setLoading(false);
      onClose();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Work to Chapter Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Assignee Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Assign Work To (Select Committee Member) *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <select
              required
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 bg-white"
            >
              <option value="">-- Choose individual member --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.role} ({m.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Task Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Task / Work Title *
          </label>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Prepare Speaker Mementos & Citations for Technovation 2026"
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Detailed Work Instructions & Scope *
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe specific institutional deliverables, guidelines, required attachments, and compliance standards..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 resize-none"
          />
        </div>

        {/* Dates and Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Priority Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 bg-white"
            >
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Weekly Report Cycle
            </label>
            <select
              value={weeklyTag}
              onChange={(e) => setWeeklyTag(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 bg-white"
            >
              <option value="2026-W45">Current (Week 45)</option>
              <option value="2026-W46">Next (Week 46)</option>
              <option value="2026-W44">Previous (Week 44)</option>
            </select>
          </div>
        </div>

        {/* Assigner attribution notice */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>Assigned By:</span>
          <span className="font-bold text-iei-navy-950">
            {currentUser?.name} ({currentUser?.role})
          </span>
        </div>

        {/* Buttons */}
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
            disabled={loading || !title.trim() || !assignedToId}
            className="px-4 py-2 text-xs font-bold bg-iei-navy-900 hover:bg-iei-navy-800 text-white rounded-lg shadow-sm disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
