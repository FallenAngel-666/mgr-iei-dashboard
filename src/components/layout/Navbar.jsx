import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Bell, 
  LogOut, 
  Menu, 
  User, 
  Shield, 
  Key, 
  Copy, 
  Check, 
  Mail, 
  Phone, 
  Building2,
  Edit3,
  Save,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { Modal } from '../common/Modal';

export function Navbar({ onToggleMobileMenu, onOpenNotifications }) {
  const { currentUser, logout, updateProfile } = useAuth();
  const { unreadCount } = useNotifications();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    avatar: '',
    department: '',
    year: '',
    bio: ''
  });

  const handleOpenModal = () => {
    if (currentUser) {
      setEditForm({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        avatar: currentUser.avatar || '',
        department: currentUser.department || '',
        year: currentUser.year || '',
        bio: currentUser.bio || ''
      });
      setIsEditingProfile(false);
      setProfileMsg({ type: '', text: '' });
    }
    setIsDetailsModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    try {
      await updateProfile(editForm);
      setProfileMsg({ type: 'success', text: 'Profile updated and synchronized to central database!' });
      setTimeout(() => {
        setIsEditingProfile(false);
        setProfileMsg({ type: '', text: '' });
      }, 1200);
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <header className="w-full shrink-0 z-30 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Top institutional strip */}
      <div className="bg-iei-navy-950 text-white text-[11px] py-1 px-4 sm:px-6 flex items-center justify-between font-medium">
        <div className="flex items-center gap-2 truncate">
          <span className="bg-iei-gold-500 text-iei-navy-950 font-bold px-1.5 py-0.5 rounded text-[10px] tracking-wide">
            NAAC A+
          </span>
          <span className="truncate">
            Dr. M.G.R. Educational and Research Institute (Deemed to be University)
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 text-slate-300">
          <span>IEI Chapter Code: MGR-SC-1935</span>
          <span className="text-slate-500">|</span>
          <span className="text-iei-gold-400 font-semibold">ISO 21001:2018 Certified</span>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Official Website Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Official Website Logo - authentic proportions maintained */}
          <div className="flex items-center gap-3">
            <img 
              src="/assets/website-logo.png" 
              alt="Dr. M.G.R. Educational and Research Institute University"
              className="h-10 sm:h-12 w-auto object-contain max-w-[200px] sm:max-w-[280px]"
            />
            <div className="hidden md:block border-l border-slate-300 pl-3">
              <h1 className="text-sm font-bold text-iei-navy-900 leading-tight font-serif">
                IEI DASHBOARD SYSTEM
              </h1>
              <p className="text-[11px] font-bold text-amber-600 tracking-wide uppercase">
                The Institution of Engineers (India)
              </p>
            </div>
          </div>
        </div>

        {/* Right: Notifications, User Profile & Log Out (Strictly no role switching) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Trigger */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-iei-navy-900 transition-colors"
            title="Open Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Current User Pill (Click to view login details) */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                onClick={handleOpenModal}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors text-left cursor-pointer"
                title="Click to view or edit your profile & credentials"
              >
                <img
                  src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=0B2545&color=fff`}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-300"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-iei-navy-950 truncate max-w-[130px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-semibold text-iei-gold-700 truncate max-w-[130px]">
                    {currentUser.role}
                  </div>
                </div>
              </button>

              {/* Explicit Log Out Button */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors text-xs font-semibold ml-1 cursor-pointer"
                title="Log out of IEI Platform"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Login Details & Profile Edit Modal */}
      {isDetailsModalOpen && currentUser && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={isEditingProfile ? "Edit My Profile Details" : "My Institutional Details & Credentials"}
        >
          <div className="space-y-4">
            {/* Header Card */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 overflow-hidden">
                <img
                  src={editForm.avatar || currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=0B2545&color=fff`}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-300 shadow-xs shrink-0"
                />
                <div className="overflow-hidden">
                  <h4 className="text-sm font-bold text-iei-navy-950 truncate">
                    {currentUser.name}
                  </h4>
                  <div className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-iei-navy-900 text-iei-gold-400 text-[10px] font-bold">
                    {currentUser.role}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(!isEditingProfile);
                  setProfileMsg({ type: '', text: '' });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isEditingProfile 
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' 
                    : 'bg-iei-navy-950 hover:bg-slate-900 text-amber-400'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}</span>
              </button>
            </div>

            {/* Notification message */}
            {profileMsg.text && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                profileMsg.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {profileMsg.text}
              </div>
            )}

            {/* EDIT PROFILE FORM */}
            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Display Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-iei-navy-900 font-medium"
                    placeholder="Official Name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-iei-navy-900 font-medium"
                      placeholder="e.g. 9884633809"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Registered Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-iei-navy-900 font-medium"
                      placeholder="official@gmail.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-iei-navy-900 font-medium"
                      placeholder="e.g. Engineering"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Academic Year / Batch
                    </label>
                    <input
                      type="text"
                      value={editForm.year}
                      onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-iei-navy-900 font-medium"
                      placeholder="e.g. 4th Year"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Profile Photograph (Direct Image URL)
                  </label>
                  <input
                    type="url"
                    value={editForm.avatar}
                    onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-iei-navy-900 font-medium"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Bio / Personal Designation Note
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-iei-navy-900 font-medium"
                    placeholder="Institutional responsibilities, research domain..."
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-4 py-2 rounded-xl bg-iei-navy-950 hover:bg-slate-900 text-amber-400 font-bold flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Saving to Cloud...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save & Synchronize</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW MODE */
              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Official Username
                    </span>
                    <span className="font-mono font-bold text-iei-navy-950 text-sm">
                      {currentUser.username || 'N/A'}
                    </span>
                  </div>
                  {currentUser.username && (
                    <button
                      onClick={() => copyToClipboard(currentUser.username, 'username')}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                    >
                      {copiedField === 'username' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Registered Email
                    </span>
                    <span className="font-semibold text-slate-800">
                      {currentUser.email}
                    </span>
                  </div>
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>

                {currentUser.phone && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Phone Number
                      </span>
                      <span className="font-semibold text-slate-800">
                        {currentUser.phone}
                      </span>
                    </div>
                    <Phone className="w-4 h-4 text-slate-400" />
                  </div>
                )}

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Department & Year
                    </span>
                    <span className="font-semibold text-slate-800">
                      {currentUser.department || 'General Engineering'} &bull; {currentUser.year || 'Committee Member'}
                    </span>
                  </div>
                  <Building2 className="w-4 h-4 text-slate-400" />
                </div>

                {currentUser.bio && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Bio / Description
                    </span>
                    <p className="text-slate-700 text-xs leading-relaxed">
                      {currentUser.bio}
                    </p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </header>
  );
}
