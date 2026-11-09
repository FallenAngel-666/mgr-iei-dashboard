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
  Globe
} from 'lucide-react';

import { 
  getPublicProfileConfig, 
  savePublicProfileConfig, 
  getPublicUpcomingEvents, 
  savePublicUpcomingEvent, 
  deletePublicUpcomingEvent,
  DEFAULT_PUBLIC_PROFILE 
} from '../../services/publicProfileService';

export function ProfileUpdateView() {
  const { currentUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('general'); // 'general' | 'carousel' | 'membership' | 'contacts' | 'events'
  
  // Form state
  const [profile, setProfile] = useState(DEFAULT_PUBLIC_PROFILE);
  const [publicEvents, setPublicEvents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Event modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '10:00 AM',
    venue: '',
    description: '',
    posterUrl: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const prof = await getPublicProfileConfig();
    const evts = await getPublicUpcomingEvents();
    setProfile(prof);
    setPublicEvents(evts);
  };

  const handleProfileSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      await savePublicProfileConfig(profile, currentUser);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setSaveError('Failed to save profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Carousel photo updates
  const handlePhotoChange = (index, field, value) => {
    const updated = [...profile.carouselPhotos];
    updated[index] = { ...updated[index], [field]: value };
    setProfile({ ...profile, carouselPhotos: updated });
  };

  // Local file upload preview helper for carousel photos
  const handlePhotoFileUpload = (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      handlePhotoChange(index, 'url', reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Contact updates
  const handleContactChange = (index, field, value) => {
    const updated = [...profile.contacts];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'phone') {
      updated[index].displayPhone = value.startsWith('+91') ? value : `+91 ${value}`;
    }
    setProfile({ ...profile, contacts: updated });
  };

  // Event handlers
  const handleOpenEventModal = (evt = null) => {
    if (evt) {
      setEditingEvent(evt);
      setEventForm({
        title: evt.title || '',
        date: evt.date || '',
        time: evt.time || '10:00 AM',
        venue: evt.venue || '',
        description: evt.description || '',
        posterUrl: evt.posterUrl || ''
      });
    } else {
      setEditingEvent(null);
      setEventForm({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00 AM',
        venue: 'Main Auditorium, Maduravoyal',
        description: '',
        posterUrl: ''
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
          <div className="inline-flex items-center gap-1.5 bg-iei-gold-50 text-iei-gold-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-iei-gold-200 mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>Public Website Directorate Controls</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-iei-navy-950">
            IEI Profile &amp; Welcome Portal Update
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Exclusive directorate portal for Chairmen and Secretaries to update public-facing Welcome Page narratives, photo carousel slides, Google Forms, contact directories, and upcoming event posters.
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
              <Save className="w-4 h-4 text-iei-gold-400" />
            )}
            <span>{saving ? 'Publishing...' : 'Publish to Public Portal'}</span>
          </button>
        </div>
      </div>

      {/* Success / Error Messages */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Updates published successfully! The public Welcome Page is now synchronized with Firebase.</span>
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
          1. About IEI &amp; Student Chapter
        </button>
        <button
          onClick={() => setActiveSubTab('carousel')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'carousel'
              ? 'bg-iei-navy-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          2. 5-Photo Carousel Manager
        </button>
        <button
          onClick={() => setActiveSubTab('membership')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'membership'
              ? 'bg-iei-navy-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          3. Membership Google Form
        </button>
        <button
          onClick={() => setActiveSubTab('contacts')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'contacts'
              ? 'bg-iei-navy-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          4. Contact Persons
        </button>
        <button
          onClick={() => setActiveSubTab('events')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'events'
              ? 'bg-iei-navy-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          5. Public Upcoming Events ({publicEvents.length})
        </button>
      </div>

      {/* SUB-TAB 1: ABOUT IEI & CHAPTER NARRATIVE */}
      {activeSubTab === 'general' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-iei-navy-950 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-iei-gold-600" />
              <span>Section A: About IEI (National Institutional Body)</span>
            </h3>
            <div className="grid grid-cols-1 gap-4 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Section Heading
                </label>
                <input
                  type="text"
                  value={profile.aboutIeiHeading}
                  onChange={(e) => setProfile({ ...profile, aboutIeiHeading: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  About IEI Description
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

          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-iei-navy-950 flex items-center gap-2">
              <Award className="w-4 h-4 text-iei-gold-600" />
              <span>Section B: About MGR IEI Student Chapter (Campus Division)</span>
            </h3>
            <div className="grid grid-cols-1 gap-4 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chapter Section Heading
                </label>
                <input
                  type="text"
                  value={profile.aboutChapterHeading}
                  onChange={(e) => setProfile({ ...profile, aboutChapterHeading: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student Chapter Description &amp; Scope
                </label>
                <textarea
                  rows={4}
                  value={profile.aboutChapterContent}
                  onChange={(e) => setProfile({ ...profile, aboutChapterContent: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: FIVE-PHOTO AUTOMATIC CAROUSEL MANAGER */}
      {activeSubTab === 'carousel' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-iei-navy-950">
                Five-Photo Automatic Carousel Slides
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                These five photos rotate continuously every 1 second in a smooth loop on the public Welcome Page.
              </p>
            </div>
            <span className="text-xs font-bold text-iei-gold-700 bg-iei-gold-50 px-3 py-1 rounded-full border border-iei-gold-200">
              5 Slides Configured
            </span>
          </div>

          <div className="space-y-4">
            {profile.carouselPhotos && profile.carouselPhotos.map((photo, idx) => (
              <div 
                key={photo.id || idx}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col md:flex-row gap-4 items-start"
              >
                {/* Photo Thumbnail */}
                <div className="w-24 h-24 rounded-xl bg-slate-900 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={photo.url}
                    alt={photo.title || `Photo ${idx + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Photo Fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Slide {idx + 1} Image Source URL or File
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={photo.url}
                        onChange={(e) => handlePhotoChange(idx, 'url', e.target.value)}
                        placeholder="Image URL (e.g. ./assets/website-logo.png or Firebase Storage)"
                        className="flex-1 text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 bg-white"
                      />
                      <label className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
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
                      Slide Title / Heading
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
                      Slide Subtitle / Caption
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

      {/* SUB-TAB 3: MEMBERSHIP GOOGLE FORM CONFIGURATION */}
      {activeSubTab === 'membership' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-iei-navy-950 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-iei-gold-600" />
              <span>Section D: IEI Student Membership Google Form</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              When a visitor on the public Welcome Page clicks <strong>"Apply for IEI Student Membership Card"</strong>, it immediately opens this Google Form URL in a new browser tab.
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
                  <span>Test Form Link</span>
                  <ExternalLink className="w-3.5 h-3.5 text-iei-gold-400" />
                </a>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Must be a valid HTTPS Google Form URL (e.g. <code>https://docs.google.com/forms/...</code>).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CONTACT PERSONS DIRECTORY */}
      {activeSubTab === 'contacts' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-iei-navy-950 flex items-center gap-2">
              <Phone className="w-4 h-4 text-iei-gold-600" />
              <span>Section E: Designated Contact Persons</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Display official contact phone numbers for student inquiries. Initial numbers are verified from the institutional committee register.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.contacts && profile.contacts.map((contact, idx) => (
              <div 
                key={contact.id || idx}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-black text-iei-navy-950 uppercase tracking-wide">
                    Contact Person {idx + 1}
                  </span>
                  <span className="text-[10px] font-bold text-iei-gold-700 bg-iei-gold-100 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Designation / Role Title
                  </label>
                  <input
                    type="text"
                    value={contact.role}
                    onChange={(e) => handleContactChange(idx, 'role', e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Phone Number (Callable on mobile)
                  </label>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-iei-navy-500 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Official Email
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

      {/* SUB-TAB 5: PUBLIC UPCOMING EVENTS & POSTERS */}
      {activeSubTab === 'events' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-iei-navy-950 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-iei-gold-600" />
                <span>Section F: Public Upcoming Events &amp; Posters</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                When you add events here, they will appear on the public Welcome Page. If no events are published, the portal displays: <em>"Upcoming events will be updated soon."</em>
              </p>
            </div>

            <button
              onClick={() => handleOpenEventModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-iei-navy-950 hover:bg-iei-navy-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-iei-gold-400" />
              <span>Publish New Event</span>
            </button>
          </div>

          {/* Events List */}
          {publicEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicEvents.map((evt) => (
                <div 
                  key={evt.id} 
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex gap-4 items-start"
                >
                  {evt.posterUrl && (
                    <div className="w-20 h-24 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                      <img 
                        src={evt.posterUrl} 
                        alt={evt.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-iei-gold-700 uppercase tracking-wider">
                      {evt.date} • {evt.time}
                    </span>
                    <h4 className="text-sm font-bold text-iei-navy-950 truncate mt-0.5">
                      {evt.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                      {evt.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => handleOpenEventModal(evt)}
                        className="text-xs font-bold text-iei-navy-900 hover:text-iei-gold-700 flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500 text-xs">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No public upcoming events are currently published.</p>
              <p className="mt-1">The public Welcome Page is currently showing the official: <em>"Upcoming events will be updated soon."</em> message.</p>
            </div>
          )}
        </div>
      )}

      {/* EVENT ADD / EDIT MODAL */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-iei-navy-950">
                {editingEvent ? 'Edit Public Upcoming Event' : 'Publish Upcoming Event to Welcome Page'}
              </h3>
              <button 
                onClick={() => setIsEventModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. Technovation 2026 — National Technical Symposium"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Calendar Date *</label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Clock Time</label>
                  <input
                    type="text"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    placeholder="e.g. 10:00 AM"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Venue / Location</label>
                <input
                  type="text"
                  value={eventForm.venue}
                  onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                  placeholder="e.g. Mechanical Seminar Hall, Campus Auditorium"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Event Description &amp; Details</label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Brief synopsis of topics, guest speakers, eligibility..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Event Poster Image (URL or Upload)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={eventForm.posterUrl}
                    onChange={(e) => setEventForm({ ...eventForm, posterUrl: e.target.value })}
                    placeholder="Poster image URL or upload image file"
                    className="flex-1 p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-iei-navy-500"
                  />
                  <label className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEventPosterUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {eventForm.posterUrl && (
                  <div className="mt-2 h-32 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center">
                    <img src={eventForm.posterUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-iei-navy-950 text-white rounded-xl font-bold uppercase tracking-wider"
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
