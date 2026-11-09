import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Trophy, 
  Plus, 
  Calendar, 
  Search, 
  Award, 
  Sparkles,
  ExternalLink 
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { createAchievement } from '../../services/firebaseService';

export function AchievementsList({ achievements = [] }) {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Institutional Award');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredAchievements = achievements.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setLoading(true);
    try {
      await createAchievement({
        title: title.trim(),
        category,
        date,
        description: description.trim(),
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&auto=format&fit=crop&q=80'
      });

      setTitle('');
      setDescription('');
      setImageUrl('');
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
              <Trophy className="w-4 h-4" />
              <span>Honor Roll & Trophies</span>
            </div>
            <h2 className="text-xl font-bold text-iei-navy-950 mt-0.5">
              Chapter Laurels & Milestones
            </h2>
            <p className="text-xs text-slate-500">
              Honoring state and national accolades won by Dr. M.G.R. Educational and Research Institute IEI Student Chapter.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-iei-navy-900 hover:bg-iei-navy-800 text-white text-xs font-bold shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-iei-gold-400" />
            <span>Record New Achievement</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between gap-3 mt-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search achievements..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredAchievements.length} institutional honors
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredAchievements.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No achievements recorded yet</h4>
          </div>
        ) : (
          filteredAchievements.map((ach) => (
            <div
              key={ach.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              {ach.imageUrl && (
                <div className="h-48 bg-slate-900 overflow-hidden relative">
                  <img
                    src={ach.imageUrl}
                    alt={ach.title}
                    className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-iei-navy-950 shadow-xs">
                    {ach.category || 'Institutional Milestone'}
                  </span>
                </div>
              )}

              <div className="p-5 flex-1">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1 font-semibold text-slate-600">
                    <Calendar className="w-3.5 h-3.5" /> {ach.date}
                  </span>
                </div>

                <h3 className="text-base font-bold text-iei-navy-950 mt-1">
                  {ach.title}
                </h3>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {ach.description}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-iei-gold-700 font-bold flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  MGR IEI Hall of Fame
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Permanent Record
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Record Achievement Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Chapter Achievement">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Achievement Title *
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Best Student Chapter Award 2025-26"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Institutional Award">Institutional Award</option>
                <option value="Competition Winner">Competition Winner</option>
                <option value="Research & Patent">Research & Patent</option>
                <option value="National Hackathon">National Hackathon</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Award Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Description & Highlights *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe participating students, faculty mentors, award organizers, prize money, or trophies received..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Photograph / Trophy Image URL (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/trophy.jpg"
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
              {loading ? 'Recording...' : 'Add to Hall of Fame'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
