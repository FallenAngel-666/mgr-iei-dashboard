import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Paperclip, 
  Calendar, 
  ShieldAlert, 
  AlertCircle,
  Trash2,
  Loader2
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { canManageAnnouncements, ROLES } from '../../config/roles';
import { createAnnouncement, deleteAnnouncement } from '../../services/firebaseService';
import { formatDistanceToNow } from 'date-fns';

export function AnnouncementsList({ announcements = [] }) {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [content, setContent] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [loading, setLoading] = useState(false);

  const canPublish = canManageAnnouncements(currentUser?.role);

  const filteredAnnouncements = announcements.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.publishedByName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id, annTitle) => {
    if (!window.confirm(`Are you sure you want to remove the circular "${annTitle}"?`)) return;
    setDeletingId(id);
    try {
      await deleteAnnouncement(id);
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      alert('Failed to delete announcement: ' + (err.message || 'Unknown error'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !currentUser) return;

    setLoading(true);
    try {
      await createAnnouncement({
        title: title.trim(),
        priority,
        content: content.trim(),
        attachmentName: attachmentName.trim() || null,
        author: {
          name: currentUser.name,
          role: currentUser.role
        }
      });

      setTitle('');
      setContent('');
      setAttachmentName('');
      setLoading(false);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 text-iei-gold-700 text-xs font-bold uppercase tracking-wider">
              <Megaphone className="w-4 h-4" />
              <span>Official Notices</span>
            </div>
            <h2 className="text-xl font-bold text-iei-navy-950 mt-0.5">
              Chapter Announcements & Circulars
            </h2>
            <p className="text-xs text-slate-500">
              Dispatched notices for deadlines, convention delegations, guidelines, and committee circulars.
            </p>
          </div>

          {canPublish && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-iei-navy-900 hover:bg-iei-navy-800 text-white text-xs font-bold shadow-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4 text-iei-gold-400" />
              <span>Broadcast Announcement</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center justify-between gap-3 mt-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars, directives..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredAnnouncements.length} published directives
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No circulars or announcements found</h4>
          </div>
        ) : (
          filteredAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-shadow p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                    ann.priority === 'Urgent'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {ann.priority} Priority
                  </span>
                  <span className="text-xs text-slate-400">
                    • {ann.publishedAt ? formatDistanceToNow(new Date(ann.publishedAt), { addSuffix: true }) : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">
                    By: <strong>{ann.publishedByName}</strong> ({ann.publishedByRole})
                  </span>
                  {(currentUser?.role === ROLES.ADMINISTRATOR || 
                    currentUser?.role === ROLES.STAFF_COORDINATOR || 
                    currentUser?.name === ann.publishedByName) && (
                    <button
                      onClick={() => handleDelete(ann.id, ann.title)}
                      disabled={deletingId === ann.id}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete circular notice"
                    >
                      {deletingId === ann.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold text-iei-navy-950">
                {ann.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed whitespace-pre-wrap">
                {ann.content}
              </p>

              {ann.attachmentName && (
                <div className="mt-4 flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 w-fit">
                  <Paperclip className="w-4 h-4 text-iei-navy-600 shrink-0" />
                  <span className="font-semibold text-iei-navy-900">
                    {ann.attachmentName}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold ml-2">
                    Official Attachment
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Broadcast Announcement Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Broadcast Official Circular">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Announcement Title *
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mandatory Briefing for Technovation 2026 Core Committee"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Priority Urgency
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent (Immediate Committee Action)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Circular Description & Content *
            </label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the full circular notice, deadlines, instructions, and target audience..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Attached File Reference Name (Optional)
            </label>
            <input
              type="text"
              value={attachmentName}
              onChange={(e) => setAttachmentName(e.target.value)}
              placeholder="e.g. Schedule_Circular_Ref_882.pdf"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold bg-iei-navy-900 hover:bg-iei-navy-800 text-white rounded-lg shadow-sm"
            >
              {loading ? 'Broadcasting...' : 'Publish & Notify Members'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
