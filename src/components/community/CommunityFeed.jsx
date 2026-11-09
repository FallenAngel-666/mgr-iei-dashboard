import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  MessagesSquare, 
  Plus, 
  ThumbsUp, 
  Sparkles, 
  Paperclip, 
  Search, 
  Calendar,
  ShieldCheck,
  Share2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PostUpdateModal } from './PostUpdateModal';
import { toggleUpdateReaction } from '../../services/firebaseService';

export function CommunityFeed({ updates = [] }) {
  const { currentUser } = useAuth();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUpdates = updates.filter((u) => {
    const matchesSearch = 
      u.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.authorRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header and Quick Post Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 text-iei-gold-700 text-xs font-bold uppercase tracking-wider">
              <MessagesSquare className="w-4 h-4" />
              <span>Chapter Community Feed</span>
            </div>
            <h2 className="text-xl font-bold text-iei-navy-950 mt-0.5">
              Work Updates & Progress Stream
            </h2>
            <p className="text-xs text-slate-500">
              Private institutional community where IEI committee members share completed milestones and work progress.
            </p>
          </div>

          <button
            onClick={() => setIsPostModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-iei-navy-900 hover:bg-iei-navy-800 text-white text-xs font-bold shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-iei-gold-400" />
            <span>Post Work Update</span>
          </button>
        </div>

        {/* Quick Post trigger card */}
        <div 
          onClick={() => setIsPostModalOpen(true)}
          className="mt-4 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center gap-3 cursor-pointer transition-colors"
        >
          <img
            src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'IEI')}&background=0B2545&color=fff`}
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-slate-300 shrink-0"
          />
          <div className="text-xs text-slate-400 flex-1 truncate">
            Share what work you've completed today, {currentUser?.name?.split(' ')[0]}...
          </div>
          <span className="text-xs font-bold text-iei-navy-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            Post
          </span>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search updates or members..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
            Showing {filteredUpdates.length} updates in chronological stream
          </div>
        </div>
      </div>

      {/* Chronological Feed Stream */}
      <div className="space-y-4">
        {filteredUpdates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <MessagesSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No work updates found</h4>
            <p className="text-xs text-slate-400 mt-1">Be the first to share an update about your ongoing chapter task!</p>
          </div>
        ) : (
          filteredUpdates.map((update) => (
            <div 
              key={update.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow p-5 sm:p-6"
            >
              {/* Post Header: Member Info, Role, Timestamp */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-iei-navy-900 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                    {update.authorName ? update.authorName.charAt(0) : 'M'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-iei-navy-950">
                      {update.authorName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <ShieldCheck className="w-3 h-3 text-amber-600" />
                        {update.authorRole}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        • {update.timestamp ? formatDistanceToNow(new Date(update.timestamp), { addSuffix: true }) : 'Recently'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Description */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap pl-1 sm:pl-2">
                {update.content}
              </div>

              {/* Attached Photo/Proof */}
              {update.imageUrl && (
                <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 max-h-96 bg-slate-900">
                  <img
                    src={update.imageUrl}
                    alt="Work attachment"
                    className="w-full h-auto max-h-96 object-contain mx-auto"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Attached Document Name */}
              {update.attachmentName && (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <Paperclip className="w-4 h-4 text-iei-navy-600 shrink-0" />
                  <span className="font-semibold text-iei-navy-900 truncate">
                    {update.attachmentName}
                  </span>
                  <span className="ml-auto text-[10px] text-slate-400 uppercase font-bold">
                    Document Attached
                  </span>
                </div>
              )}

              {/* Footer: Reactions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleUpdateReaction(update.id, 'like')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-iei-navy-900 hover:bg-slate-100 transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4 text-iei-navy-600" />
                    <span>Acknowledge</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold">
                      {update.reactions?.like || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => toggleUpdateReaction(update.id, 'celebrate')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Commend</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold">
                      {update.reactions?.celebrate || 0}
                    </span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-400">
                  IEI Student Chapter Official Record
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <PostUpdateModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />
    </div>
  );
}
