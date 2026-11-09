import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  isFirstLevelApprover, 
  isStaffCoordinator,
  canManageMembers,
  canAccessMembersDirectory,
  canAccessManagementReports,
  canAccessProfileUpdate,
  canAccessActivityConsole
} from '../../config/roles';
import { 
  LayoutDashboard, 
  MessagesSquare, 
  CheckSquare, 
  ShieldAlert, 
  CalendarCheck, 
  Users, 
  Calendar, 
  FileText, 
  Award, 
  Trophy, 
  Megaphone,
  Globe,
  Terminal,
  X,
  Building2
} from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen, pendingApprovalCount = 0 }) {
  const { currentUser } = useAuth();
  const role = currentUser?.role || '';

  const isLevel1 = isFirstLevelApprover(role);
  const isFinal = isStaffCoordinator(role);
  const canReview = isLevel1 || isFinal;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard & Weekly',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'community',
      label: 'Community Updates',
      icon: MessagesSquare,
      badge: null
    },
    {
      id: 'tasks',
      label: 'Work Assignments',
      icon: CheckSquare,
      badge: null
    },
    {
      id: 'approvals',
      label: 'Report Approvals',
      icon: ShieldAlert,
      badge: canReview && pendingApprovalCount > 0 ? pendingApprovalCount : null,
      badgeColor: 'bg-amber-500'
    },
    {
      id: 'attendance',
      label: 'Meeting Attendance',
      icon: CalendarCheck,
      badge: null
    },
    {
      id: 'members',
      label: 'Members Directory',
      icon: Users,
      badge: null
    },
    {
      id: 'events',
      label: 'Events & Programs',
      icon: Calendar,
      badge: null
    },
    {
      id: 'reports',
      label: 'Institutional Reports',
      icon: FileText,
      badge: null
    },
    {
      id: 'certificates',
      label: 'Certificates',
      icon: Award,
      badge: null
    },
    {
      id: 'achievements',
      label: 'Achievements',
      icon: Trophy,
      badge: null
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: Megaphone,
      badge: null
    },
    {
      id: 'profileUpdate',
      label: 'IEI Profile Update',
      icon: Globe,
      badge: null
    },
    {
      id: 'activityConsole',
      label: 'System Activity Console',
      icon: Terminal,
      badge: null
    }
  ];

  const canSeeMembers = canAccessMembersDirectory(currentUser);
  const canEditPublicProfile = canAccessProfileUpdate(role);
  const canSeeConsole = canAccessActivityConsole(currentUser);

  const visibleNavItems = navItems.filter((item) => {
    if (item.id === 'members' && !canSeeMembers) return false;
    if (item.id === 'profileUpdate' && !canEditPublicProfile) return false;
    if (item.id === 'activityConsole' && !canSeeConsole) return false;
    return true;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-iei-navy-900 text-white flex flex-col border-r border-iei-navy-800 transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Area with APK Logo (Official IEI Emblem) */}
        <div className="p-4 border-b border-iei-navy-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/apk-logo.png" 
              alt="Institution of Engineers (India) Emblem"
              className="w-12 h-12 object-contain rounded-full bg-white p-1 shadow-md shrink-0"
            />
            <div className="overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block font-serif">
                MGR IEI DASHBOARD
              </span>
              <h2 className="text-sm font-bold text-white truncate">
                Dr. M.G.R. Chapter
              </h2>
              <span className="text-[10px] text-slate-400 block">
                Charter 1935
              </span>
            </div>
          </div>
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-iei-navy-300 uppercase tracking-wider">
            Management Modules
          </div>

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-iei-gold-500 text-iei-navy-950 shadow-md font-bold'
                    : 'text-slate-300 hover:bg-iei-navy-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-iei-navy-950' : 'text-iei-navy-300'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${item.badgeColor || 'bg-blue-600'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info: Institutional seal badge */}
        <div className="p-3 border-t border-iei-navy-800 bg-iei-navy-950/70">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-iei-gold-400 shrink-0" />
            <div className="text-[11px] leading-tight text-slate-300">
              <span className="font-semibold text-white block">Official Chapter Portal</span>
              <span className="text-[10px] text-slate-400">Dr. M.G.R. DU, Chennai-95</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
