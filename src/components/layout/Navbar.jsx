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
  Building2 
} from 'lucide-react';
import { Modal } from '../common/Modal';

export function Navbar({ onToggleMobileMenu, onOpenNotifications }) {
  const { currentUser, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs">
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
              src="./assets/website-logo.png" 
              alt="Dr. M.G.R. Educational and Research Institute University"
              className="h-10 sm:h-12 w-auto object-contain max-w-[200px] sm:max-w-[280px]"
            />
            <div className="hidden lg:block border-l border-slate-300 pl-3">
              <h1 className="text-sm font-bold text-iei-navy-900 leading-tight">
                The Institution of Engineers (India)
              </h1>
              <p className="text-[11px] font-semibold text-iei-gold-700 tracking-wide uppercase">
                MGR Student Chapter Portal
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
                onClick={() => setIsDetailsModalOpen(true)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors text-left"
                title="Click to view your login details"
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

      {/* User Login Details Modal */}
      {isDetailsModalOpen && currentUser && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title="My Institutional Login Details"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <img
                src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=0B2545&color=fff`}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-300 shadow-xs"
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
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1 text-[11px] font-semibold"
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
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
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
        </Modal>
      )}
    </header>
  );
}
