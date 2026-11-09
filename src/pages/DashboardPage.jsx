import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToData } from '../services/firebaseService';
import { WORK_STATUSES, isFirstLevelApprover, isStaffCoordinator, canAccessMembersDirectory } from '../config/roles';

// Components
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import { NotificationDrawer } from '../components/common/NotificationDrawer';

import { MetricCards } from '../components/dashboard/MetricCards';
import { WeeklyStatusSection } from '../components/dashboard/WeeklyStatusSection';
import { PendingApprovalsCard } from '../components/dashboard/PendingApprovalsCard';
import { ActivityTimeline } from '../components/dashboard/ActivityTimeline';

import { CommunityFeed } from '../components/community/CommunityFeed';
import { TaskList } from '../components/tasks/TaskList';
import { ApprovalWorkflowView } from '../components/approvals/ApprovalWorkflowView';
import { ReviewReportModal } from '../components/approvals/ReviewReportModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { AttendanceList } from '../components/attendance/AttendanceList';
import { MembersList } from '../components/members/MembersList';
import { EventsList } from '../components/events/EventsList';
import { ReportsCenter } from '../components/reports/ReportsCenter';
import { CertificatesList } from '../components/certificates/CertificatesList';
import { AchievementsList } from '../components/achievements/AchievementsList';
import { AnnouncementsList } from '../components/announcements/AnnouncementsList';

export function DashboardPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  // Real-time reactive data stores
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [achievements, setAchievements] = useState([]);

  // Modal handlers
  const [selectedTaskForReview, setSelectedTaskForReview] = useState(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null);

  useEffect(() => {
    const unsubMembers = subscribeToData('members', setMembers);
    const unsubTasks = subscribeToData('tasks', setTasks);
    const unsubUpdates = subscribeToData('updates', setUpdates);
    const unsubEvents = subscribeToData('events', setEvents);
    const unsubAttendance = subscribeToData('attendance', setAttendance);
    const unsubAnnouncements = subscribeToData('announcements', setAnnouncements);
    const unsubCertificates = subscribeToData('certificates', setCertificates);
    const unsubAchievements = subscribeToData('achievements', setAchievements);

    return () => {
      unsubMembers();
      unsubTasks();
      unsubUpdates();
      unsubEvents();
      unsubAttendance();
      unsubAnnouncements();
      unsubCertificates();
      unsubAchievements();
    };
  }, []);

  // Compute pending approvals for active user
  const role = currentUser?.role || '';
  const isLevel1 = isFirstLevelApprover(role);
  const isFinal = isStaffCoordinator(role);

  const pendingApprovalsCount = tasks.filter((t) => {
    if (isLevel1 && t.status === WORK_STATUSES.PENDING_FIRST_LEVEL) return true;
    if (isFinal && t.status === WORK_STATUSES.PENDING_FINAL) return true;
    return false;
  }).length;

  const handleNavigateToNotificationItem = (notif) => {
    if (notif.linkId) {
      const task = tasks.find((t) => t.id === notif.linkId);
      if (task) {
        setSelectedTaskForDetail(task);
        return;
      }
    }
    if (notif.type === 'community_update') setActiveTab('community');
    else if (notif.type === 'event') setActiveTab('events');
    else if (notif.type === 'announcement') setActiveTab('announcements');
    else setActiveTab('tasks');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        onToggleMobileMenu={() => setMobileMenuOpen(true)}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
          pendingApprovalCount={pendingApprovalsCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <MetricCards
                  members={members}
                  tasks={tasks}
                  events={events}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                />

                {/* MANDATORY: Dedicated Weekly Status Section */}
                <WeeklyStatusSection
                  tasks={tasks}
                  updates={updates}
                  onSelectTask={(task) => setSelectedTaskForDetail(task)}
                />

                {/* Two-Level Pending Approvals Review Card */}
                <PendingApprovalsCard
                  tasks={tasks}
                  onReviewReport={(task) => setSelectedTaskForReview(task)}
                  onNavigateToApprovals={() => setActiveTab('approvals')}
                />

                {/* Chapter Activities & Upcoming Events Timeline */}
                <ActivityTimeline
                  events={events}
                  announcements={announcements}
                  updates={updates}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                />
              </div>
            )}

            {/* COMMUNITY UPDATES TAB */}
            {activeTab === 'community' && (
              <CommunityFeed updates={updates} />
            )}

            {/* WORK ASSIGNMENTS TAB */}
            {activeTab === 'tasks' && (
              <TaskList
                tasks={tasks}
                members={members}
                onOpenReviewReport={(task) => setSelectedTaskForReview(task)}
              />
            )}

            {/* TWO-LEVEL APPROVAL WORKFLOW TAB */}
            {activeTab === 'approvals' && (
              <ApprovalWorkflowView tasks={tasks} />
            )}

            {/* COMMITTEE MEETING ATTENDANCE TAB */}
            {activeTab === 'attendance' && (
              <AttendanceList
                attendance={attendance}
                events={events}
                members={members}
              />
            )}

            {/* MEMBERS DIRECTORY TAB - Strictly restricted to Sri Priyan, Ramya Sri, and Master Administrator */}
            {activeTab === 'members' && (
              canAccessMembersDirectory(currentUser) ? (
                <MembersList members={members} />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                    🔒
                  </div>
                  <h3 className="text-base font-bold text-iei-navy-950">Confidential Directory Access Restricted</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    The Chapter Membership Directory is confidential and strictly accessible only by 
                    <strong className="text-iei-navy-900 block mt-1">Sri Priyan (Joint Secretary), Ramya Sri &amp; Swathi Nandhana (Membership Directorate)</strong>
                  </p>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="mt-5 px-4 py-2 bg-iei-navy-900 hover:bg-iei-navy-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Return to Chapter Dashboard
                  </button>
                </div>
              )
            )}

            {/* EVENTS TAB */}
            {activeTab === 'events' && (
              <EventsList
                events={events}
                onNavigateToAttendance={(ev) => setActiveTab('attendance')}
              />
            )}

            {/* REPORTS TAB */}
            {activeTab === 'reports' && (
              <ReportsCenter
                tasks={tasks}
                members={members}
                events={events}
                attendance={attendance}
              />
            )}

            {/* CERTIFICATES TAB */}
            {activeTab === 'certificates' && (
              <CertificatesList
                certificates={certificates}
                members={members}
              />
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === 'achievements' && (
              <AchievementsList achievements={achievements} />
            )}

            {/* ANNOUNCEMENTS TAB */}
            {activeTab === 'announcements' && (
              <AnnouncementsList announcements={announcements} />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Navigation Bar */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMore={() => setMobileMenuOpen(true)}
        pendingApprovalCount={pendingApprovalsCount}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        onNavigateToItem={handleNavigateToNotificationItem}
      />

      {/* Review Report Modal */}
      {selectedTaskForReview && (
        <ReviewReportModal
          isOpen={!!selectedTaskForReview}
          onClose={() => setSelectedTaskForReview(null)}
          task={selectedTaskForReview}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTaskForDetail && (
        <TaskDetailModal
          isOpen={!!selectedTaskForDetail}
          onClose={() => setSelectedTaskForDetail(null)}
          task={selectedTaskForDetail}
          onOpenReviewReport={(t) => setSelectedTaskForReview(t)}
        />
      )}
    </div>
  );
}
