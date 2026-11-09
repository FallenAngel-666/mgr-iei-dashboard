import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  Sparkles, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Phone, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  ExternalLink,
  BookOpen,
  Award,
  Globe,
  HelpCircle,
  Clock,
  MapPin
} from 'lucide-react';

import { 
  getPublicProfileConfig, 
  savePublicProfileConfig, 
  getPublicUpcomingEvents, 
  savePublicUpcomingEvent, 
  deletePublicUpcomingEvent,
  subscribeToPublicProfile,
  subscribeToPublicEvents,
  DEFAULT_PUBLIC_PROFILE 
} from '../../services/publicProfileService';

export function ProfileUpdateView() {
  const { currentUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('general'); // 'general' | 'carousel' | 'events' | 'membership' | 'contacts'
  
  // Profile state
  const [profile, setProfile] = useState(DEFAULT_PUBLIC_PROFILE);
  const [publicEvents, setPublicEvents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Three-line editor state for Chapter introduction
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [line3, setLine3] = useState('');

  // Event modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '10:00 AM',
    venue: '',
    description: '',
    posterUrl: '',
    registrationLink: ''
  });

  useEffect(() => {
    loadData();
    const unsubProfile = subscribeToPublicProfile((prof) => {
      setProfile(prof);
      const lines = Array.isArray(prof.aboutChapterLines) && prof.aboutChapterLines.length === 3
        ? prof.aboutChapterLines
        : (prof.aboutChapterContent || '').split('\n').filter(Boolean);
      if (lines.length >= 3) {
        setLine1(lines[0] || '');
        setLine2(lines[1] || '');
        setLine3(lines[2] || '');
      }
    });
    const unsubEvents = subscribeToPublicEvents((evts) => {
      setPublicEvents(evts);
    });
    return () => {
      unsubProfile();
      unsubEvents();
    };
  }, []);

  const loadData = async () => {
    const prof = await getPublicProfileConfig();
    const evts = await getPublicUpcomingEvents();
    setProfile(prof);
    setPublicEvents(evts);

    // Initialize 3 lines
    const lines = Array.isArray(prof.aboutChapterLines) && prof.aboutChapterLines.length === 3
      ? prof.aboutChapterLines
      : (prof.aboutChapterContent || '').split('\n').filter(Boolean);

    setLine1(lines[0] || 'Empowering future engineers through multidisciplinary technical symposiums, research, and innovation.');
    setLine2(lines[1] || 'Fostering academic excellence, professional ethics, and hands-on technological leadership across departments.');
    setLine3(lines[2] || 'Operating under the national charter of The Institution of Engineers (India) at Dr. M.G.R. Educational and Research Institute.');
  };

  const handleProfileSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const updatedLines = [line1.trim(), line2.trim(), line3.trim()];
      const updatedProfile = {
        ...profile,
        aboutChapterHeading: 'About MGR IEI Student Chapter',
        aboutChapterLines: updatedLines,
        aboutChapterContent: updatedLines.join('\n')
      };

      await savePublicProfileConfig(updatedProfile, currentUser);
      setProfile(updatedProfile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setSaveError('Failed to save profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // 5-Photo Carousel Updates
  const handlePhotoChange = (index, field, value) => {
    const updated = [...(profile.carouselPhotos || [])];
    updated[index] = { ...updated[index], [field]: value };
    setProfile({ ...profile, carouselPhotos: updated });
  };

  const handlePhotoFileUpload = (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      handlePhotoChange(index, 'url', reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Contact Persons Updates (Sriman Narayana Moorthy & Geethalakshmi)
  const handleContactChange = (index, field, value) => {
    const updated = [...(profile.contacts || [])];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'phone') {
      const clean = value.replace(/\D/g, '');
      updated[index].phone = clean;
      updated[index].displayPhone = value.startsWith('+91') ? value : `+91 ${clean}`;
    }
    setProfile({ ...profile, contacts: updated });
  };

  // Upcoming Event Modal & Handlers
  const handleOpenEventModal = (evt = null) => {
    if (evt) {
      setEditingEvent(evt);
      setEventForm({
        title: evt.title || '',
        date: evt.date || '',
        time: evt.time || '10:00 AM',
        venue: evt.venue || '',
        description: evt.description || '',
        posterUrl: evt.posterUrl || '',
        registrationLink: evt.registrationLink || ''
      });
    } else {
      setEditingEvent(null);
      setEventForm({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00 AM',
        venue: 'Main Auditorium, Maduravoyal',
        description: '',
        posterUrl: '',
        registrationLink: ''
      });
    }
    setIsEventModalOpen(true);
  };

  const handleEventPosterUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setEventForm((prev) => ({ ...prev, posterUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.date) return;

    setSaving(true);
    try {
      await savePublicUpcomingEvent({
        ...eventForm,
        id: editingEvent?.id
      }, currentUser);
      
      const updatedEvents = await getPublicUpcomingEvents();
      setPublicEvents(updatedEvents);
      setIsEventModalOpen(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setSaveError('Failed to save upcoming event.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to remove this public upcoming event?')) return;
    try {
      await deletePublicUpcomingEvent(id);
      const updatedEvents = await getPublicUpcomingEvents();
      setPublicEvents(updatedEvents);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200 mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>Public Website Directorate Controls</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-iei-navy-950 font-serif">
            IEI PROFILE UPDATE
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Exclusive directorate portal for Chairman, Vice-Chairman, Secretary, and Joint Secretary to update public-facing Welcome Page narratives, 3-line chapter introduction, five gallery photos, upcoming events, and contact numbers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleProfileSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-iei-navy-900 hover:bg-iei-navy-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4 text-amber-400" />
            )}
            <span>{saving ? 'Publishing...' : 'Save & Publish Changes'}</span>
          </button>
        </div>
      </div>

      {/* Success / Error Banners */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Updates saved and published successfully! The public Welcome Page is now live with your changes.</span>
        </div>
      )}
      {saveError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'general'
              ? 'bg-iei-navy-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          1. About IEI &amp; Chapter (3-Lines)
        </button>
        <button
          onClick={() => setActiveSubTab('carousel')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'carousel'
              ? 'bg-iei-navy-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          2. Five Chapter Photos
        </button>
        <button
          onClick={() => setActiveSubTab('events')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'events'
              ? 'bg-iei-navy-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          3. Upcoming Events ({publicEvents.length})
        </button>
        <button
          onClick={() => setActiveSubTab('membership')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'membership'
              ? 'bg-iei-navy-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          4. IEI Membership Form Link
        </button>
        <button
          onClick={() => setActiveSubTab('contacts')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'contacts'
              ? 'bg-iei-navy-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          5. Contact Details (Sriman &amp; Geethalakshmi)
        </button>
      </div>

      {/* ============================================================ */}
      {/* SUB-TAB 1: ABOUT IEI & 3-LINE CHAPTER INTRODUCTION           */}
      {/* ============================================================ */}
      {activeSubTab === 'general' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          {/* Section A: About IEI */}
          <div>
            <h3 className="text-sm font-bold text-iei-navy-950 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Section 1: About IEI (THE INSTITUTION OF ENGINEERS (INDIA))</span>
            </h3>
            <div className="grid grid-cols-1 gap-4 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Institutional Name / Heading
                </label>
                <input
                  type="text"
                  value={profile.aboutIeiHeading}
                  onChange={(e) => setProfile({ ...profile, aboutIeiHeading: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500 font-serif"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  About IEI Introduction
                </label>
                <textarea
                  rows={4}
                  value={profile.aboutIeiContent}
                  onChange={(e) => setProfile({ ...profile, aboutIeiContent: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500"
                />
              </div>
            </div>
          </div>

          {/* Section B: About MGR IEI Student Chapter (EXACTLY THREE LINES) */}
          <div className="pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-iei-navy-950 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Section 2: About MGR IEI Student Chapter (EXACTLY THREE LINES)</span>
              </h3>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                Enforced 3-Line Format
              </span>
            </div>
            
            <p className="text-xs text-slate-500 mb-4">
              Enter each of the three lines individually below. These appear as distinct bulleted statements on the public homepage.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Line 1 (Focus: Technical Symposiums, Research &amp; Innovation) *
                </label>
                <input
                  type="text"
                  required
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="Empowering future engineers through multidisciplinary technical symposiums, research, and innovation."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Line 2 (Focus: Academic Excellence &amp; Technological Leadership) *
                </label>
                <input
                  type="text"
                  required
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Fostering academic excellence, professional ethics, and hands-on technological leadership across departments."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Line 3 (Focus: Institutional Charter &amp; University Accreditation) *
                </label>
                <input
                  type="text"
                  required
                  value={line3}
                  onChange={(e) => setLine3(e.target.value)}
                  placeholder="Operating under the national charter of The Institution of Engineers (India) at Dr. M.G.R. Educational and Research Institute."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500 bg-white"
                />
              </div>
            </div>

            {/* Live 3-Line Preview */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Live 3-Line Homepage Preview:
              </span>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex gap-2">
                  <span className="font-bold text-amber-600">1.</span>
                  <span>{line1 || '(Empty line 1)'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-amber-600">2.</span>
                  <span>{line2 || '(Empty line 2)'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-amber-600">3.</span>
                  <span>{line3 || '(Empty line 3)'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 2: FIVE CHAPTER PHOTOS GALLERY                       */}
      {/* ============================================================ */}
      {activeSubTab === 'carousel' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-iei-navy-950 font-serif">
                Five Photographs of MGR IEI Student Chapter
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload, replace, or customize each of the five photographs displayed in the 1-second automatic slideshow.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              5 Photos Active
            </span>
          </div>

          <div className="space-y-4">
            {(profile.carouselPhotos || []).map((photo, idx) => (
              <div 
                key={photo.id || idx}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col md:flex-row gap-4 items-start"
              >
                {/* Photo Thumbnail */}
                <div className="w-28 h-28 rounded-xl bg-slate-900 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={photo.url}
                    alt={photo.title || `Photograph ${idx + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Photo Fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Photograph {idx + 1} Image Source URL or Upload
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={photo.url}
                        onChange={(e) => handlePhotoChange(idx, 'url', e.target.value)}
                        placeholder="Image URL or local path (/assets/apk-logo.png)"
                        className="flex-1 text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 bg-white"
                      />
                      <label className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoFileUpload(idx, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Photograph Title / Heading
                    </label>
                    <input
                      type="text"
                      value={photo.title || ''}
                      onChange={(e) => handlePhotoChange(idx, 'title', e.target.value)}
                      placeholder="e.g. Dr. M.G.R. Educational and Research Institute"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Photograph Caption / Subtitle
                    </label>
                    <input
                      type="text"
                      value={photo.caption || ''}
                      onChange={(e) => handlePhotoChange(idx, 'caption', e.target.value)}
                      placeholder="e.g. NAAC A+ Accredited Campus • Maduravoyal"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 3: UPCOMING EVENTS & POSTERS                         */}
      {/* ============================================================ */}
      {activeSubTab === 'events' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-iei-navy-950 font-serif">
                Upcoming Chapter Events &amp; Posters
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Add, edit, or remove technical event announcements, event dates, descriptions, and uploaded posters displayed on the public homepage.
              </p>
            </div>
            <button
              onClick={() => handleOpenEventModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-iei-navy-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Event Poster</span>
            </button>
          </div>

          {publicEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicEvents.map((evt) => (
                <div 
                  key={evt.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex gap-4 items-start justify-between"
                >
                  <div className="flex gap-3 items-start flex-1 min-w-0">
                    {evt.posterUrl ? (
                      <img 
                        src={evt.posterUrl} 
                        alt="Poster" 
                        className="w-16 h-20 object-cover rounded-lg border border-slate-300 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-20 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <Calendar className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-amber-700">
                        <span>{evt.date}</span>
                        {evt.time && <span>• {evt.time}</span>}
                      </div>
                      <h4 className="font-bold text-sm text-iei-navy-950 truncate mt-0.5">
                        {evt.title}
                      </h4>
                      {evt.venue && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {evt.venue}
                        </p>
                      )}
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                        {evt.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEventModal(evt)}
                      className="p-1.5 text-slate-500 hover:text-iei-navy-900 hover:bg-slate-200 rounded-lg cursor-pointer"
                      title="Edit Event"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">
                No public upcoming events are currently published.
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                The public Welcome Page will cleanly display "Upcoming events will be updated soon."
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 4: IEI MEMBERSHIP GOOGLE FORM URL                    */}
      {/* ============================================================ */}
      {activeSubTab === 'membership' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-iei-navy-950 flex items-center gap-2 font-serif">
              <LinkIcon className="w-4 h-4 text-amber-600" />
              <span>Section 5: IEI Student Membership Google Form URL</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              When a visitor on the public homepage clicks <strong>"Apply for IEI Student Membership Card"</strong>, this Google Form URL opens immediately in a new tab.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Google Form URL *
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={profile.membershipFormUrl}
                  onChange={(e) => setProfile({ ...profile, membershipFormUrl: e.target.value })}
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500 bg-white font-mono"
                  required
                />
                <a
                  href={profile.membershipFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-iei-navy-900 hover:bg-iei-navy-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </a>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Must be an active Google Form link.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 5: CONTACT DETAILS (SRIMAN & GEETHALAKSHMI)          */}
      {/* ============================================================ */}
      {activeSubTab === 'contacts' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-iei-navy-950 flex items-center gap-2 font-serif">
              <Phone className="w-4 h-4 text-amber-600" />
              <span>Section 6: Contact Persons (Sriman Narayana Moorthy &amp; Geethalakshmi)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Maintain the contact details and clickable telephone links for Student Chairpersons Sriman Narayana Moorthy and Geethalakshmi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(profile.contacts || []).map((contact, idx) => (
              <div 
                key={contact.id || idx}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-black text-iei-navy-950 uppercase tracking-wide">
                    {contact.name || `Contact ${idx + 1}`}
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    Student Chairman Elect
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Display Name (Official Name) *
                  </label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    value={contact.role || 'Student Chairman Elect'}
                    onChange={(e) => handleContactChange(idx, 'role', e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Phone Number (Clickable telephone link) *
                  </label>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                    placeholder="e.g. 8015803274"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 bg-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Saved as telephone link: <code>tel:{contact.phone}</code>
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={contact.email || ''}
                    onChange={(e) => handleContactChange(idx, 'email', e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EVENT EDIT / ADD MODAL */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-iei-navy-950 mb-4 font-serif">
              {editingEvent ? 'Edit Upcoming Event & Poster' : 'Add New Upcoming Event Poster'}
            </h3>

            <form onSubmit={handleSaveEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Title / Technical Program Name *
                </label>
                <input
                  required
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. National Symposium on Sustainable AI"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Event Date *
                  </label>
                  <input
                    required
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Event Time
                  </label>
                  <input
                    type="text"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    placeholder="10:00 AM - 1:00 PM"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Campus Venue / Location
                </label>
                <input
                  type="text"
                  value={eventForm.venue}
                  onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                  placeholder="e.g. Main Auditorium, Phase II Campus"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Poster URL or File Upload
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={eventForm.posterUrl}
                    onChange={(e) => setEventForm({ ...eventForm, posterUrl: e.target.value })}
                    placeholder="Poster URL or upload image below"
                    className="flex-1 text-xs p-2 rounded-lg border border-slate-300"
                  />
                  <label className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Poster</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEventPosterUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Description &amp; Highlights
                </label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Provide an overview of key technical topics, speakers, and student activities..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  External Registration Form Link (optional)
                </label>
                <input
                  type="url"
                  value={eventForm.registrationLink}
                  onChange={(e) => setEventForm({ ...eventForm, registrationLink: e.target.value })}
                  placeholder="https://forms.gle/..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold bg-iei-navy-950 text-white rounded-xl hover:bg-slate-900 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save & Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
