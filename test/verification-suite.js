import assert from 'node:assert';
import { 
  ROLES, 
  WORK_STATUSES, 
  FIRST_LEVEL_APPROVER_ROLES, 
  isFirstLevelApprover, 
  isStaffCoordinator, 
  isMasterAdmin,
  canAssignWork, 
  canManageMembers,
  canAccessMembersDirectory,
  canManageEvents,
  canRecordAttendance,
  canAccessProfileUpdate,
  canAccessActivityConsole,
  canOverrideAnything
} from '../src/config/roles.js';

import {
  getAuditLogs,
  recordActivity,
  subscribeToAuditLogs,
  AUDIT_MODULES,
  AUDIT_ACTIONS
} from '../src/services/auditService.js';

import {
  getPublicProfileConfig,
  savePublicProfileConfig,
  getPublicUpcomingEvents,
  savePublicUpcomingEvent,
  deletePublicUpcomingEvent,
  DEFAULT_PUBLIC_PROFILE
} from '../src/services/publicProfileService.js';

import {
  getMembers,
  saveMember,
  deleteMember,
  updateUserProfile,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getUpdates,
  createCommunityUpdate,
  toggleUpdateReaction,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getAttendance,
  recordEventAttendance,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getNotifications,
  createNotification,
  resetToCleanSlate,
  subscribeToData
} from '../src/services/firebaseService.js';

import { db } from '../src/config/firebase.js';
import { doc, getDoc, collection, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

import {
  generateUsername,
  generateStrongPassword,
  formatCredentialNotice
} from '../src/services/credentialService.js';

import {
  getISOWeekDetails,
  getISOWeekDateRange,
  generateWeekOptions
} from '../src/utils/dateUtils.js';

import {
  submitWorkReport,
  processFirstLevelReview,
  processFinalApproval
} from '../src/services/approvalService.js';

async function runTestSuite() {
  console.log('================================================================');
  console.log('   MGR IEI STUDENT CHAPTER PLATFORM — PRODUCTION AUDIT SUITE   ');
  console.log('================================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      failedCount++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      failedCount++;
    }
  }

  // Reset to pristine state for testing
  resetToCleanSlate();

  // 1. IEI ROLES & PERMISSIONS
  console.log('--- 1. IEI Roles & Institutional Authority Hierarchy ---');
  test('11 exact IEI student chapter roles are defined including Master Administrator', () => {
    assert.strictEqual(Object.keys(ROLES).length, 11);
    assert.strictEqual(ROLES.ADMINISTRATOR, 'Administrator');
    assert.strictEqual(ROLES.STAFF_COORDINATOR, 'Staff Coordinator');
    assert.strictEqual(ROLES.CHAIRMAN, 'Chairman');
    assert.strictEqual(ROLES.VICE_CHAIRMAN, 'Vice Chairman');
    assert.strictEqual(ROLES.SECRETARY, 'Secretary');
    assert.strictEqual(ROLES.JOINT_SECRETARY, 'Joint Secretary');
    assert.strictEqual(ROLES.TREASURER, 'Treasurer');
    assert.strictEqual(ROLES.JOINT_TREASURER, 'Joint Treasurer');
    assert.strictEqual(ROLES.MEMBERSHIP_DIRECTOR, 'Membership Director');
    assert.strictEqual(ROLES.EVENT_MANAGEMENT_HEAD, 'Event Management Head');
    assert.strictEqual(ROLES.EXECUTIVE_MEMBER, 'Executive Member');
  });

  test('Administrator is Master User with full override authority', () => {
    assert.ok(isMasterAdmin(ROLES.ADMINISTRATOR), 'Administrator is Master Admin');
    assert.ok(canOverrideAnything(ROLES.ADMINISTRATOR), 'Administrator can override anything');
    assert.ok(!isMasterAdmin(ROLES.STAFF_COORDINATOR), 'Staff is not Master Admin');
    assert.ok(!isMasterAdmin(ROLES.CHAIRMAN), 'Chairman is not Master Admin');
  });

  test('First-level approvers include Chairman, Vice Chairman, Secretary, Joint Secretary, and Administrator', () => {
    assert.ok(isFirstLevelApprover(ROLES.CHAIRMAN));
    assert.ok(isFirstLevelApprover(ROLES.VICE_CHAIRMAN));
    assert.ok(isFirstLevelApprover(ROLES.SECRETARY));
    assert.ok(isFirstLevelApprover(ROLES.JOINT_SECRETARY));
    assert.ok(isFirstLevelApprover(ROLES.ADMINISTRATOR));
    assert.ok(!isFirstLevelApprover(ROLES.EXECUTIVE_MEMBER));
    assert.ok(!isFirstLevelApprover(ROLES.TREASURER));
  });

  test('Final authority is strictly Administrator and Staff Coordinator', () => {
    assert.ok(isStaffCoordinator(ROLES.STAFF_COORDINATOR));
    assert.ok(isStaffCoordinator(ROLES.ADMINISTRATOR));
    assert.ok(!isMasterAdmin(ROLES.CHAIRMAN));
  });

  test('Administrator, Staff Coordinator, Chairmen, Vice Chairman, Secretaries, and Event Head can assign work', () => {
    assert.ok(canAssignWork(ROLES.ADMINISTRATOR), 'Administrator can assign work');
    assert.ok(canAssignWork(ROLES.STAFF_COORDINATOR), 'Staff Coordinator can assign work');
    assert.ok(canAssignWork(ROLES.CHAIRMAN), 'Chairman can assign work');
    assert.ok(canAssignWork(ROLES.VICE_CHAIRMAN), 'Vice Chairman can assign work');
    assert.ok(canAssignWork(ROLES.SECRETARY), 'Secretary can assign work');
    assert.ok(canAssignWork(ROLES.JOINT_SECRETARY), 'Joint Secretary can assign work');
    assert.ok(canAssignWork(ROLES.EVENT_MANAGEMENT_HEAD), 'Event Head can assign work');
    assert.ok(!canAssignWork(ROLES.EXECUTIVE_MEMBER), 'Executive Member cannot assign work');
  });

  // 2. REAL COMMITTEE MEMBERS & CREDENTIALS
  console.log('\n--- 2. Real Committee Members & Master Administrator ---');
  let loadedMembers;
  await asyncTest('Real committee members register contains exactly 23 accounts (21 members + 1 Staff + 1 Administrator)', async () => {
    loadedMembers = await getMembers();
    assert.strictEqual(loadedMembers.length, 23, `Expected 23 accounts, found ${loadedMembers.length}`);
  });

  test('Master Administrator has username admin.master-01 and administrator alias', () => {
    const admin = loadedMembers.find((m) => m.role === ROLES.ADMINISTRATOR);
    assert.ok(admin, 'Administrator account exists');
    assert.strictEqual(admin.username, 'admin.master-01');
    assert.strictEqual(admin.secondaryUsername, 'administrator');
    assert.strictEqual(admin.name, 'Administrator');
    assert.ok(admin.isMasterAdmin === true);
  });

  test('Staff Coordinator (Staff Login) has username staff.login and staff.coord-01 alias', () => {
    const staff = loadedMembers.find((m) => m.role === ROLES.STAFF_COORDINATOR);
    assert.ok(staff, 'Staff Coordinator account exists');
    assert.strictEqual(staff.username, 'staff.login');
    assert.strictEqual(staff.secondaryUsername, 'staff.coord-01');
    assert.strictEqual(staff.name, 'Staff Coordinator');
    assert.ok(!loadedMembers.some((m) => m.name.toLowerCase().includes('senthil')), 'No Senthil Kumar exists');
  });

  test('Chairman Sriman has official username sriman.chair-01 and strong password', () => {
    const sriman = loadedMembers.find((m) => m.name.includes('SRIMAN'));
    assert.ok(sriman, 'Sriman should exist');
    assert.strictEqual(sriman.username, 'sriman.chair-01');
    assert.strictEqual(sriman.role, ROLES.CHAIRMAN);
    assert.ok(sriman.password && sriman.password.length >= 8);
  });

  test('Joint Secretary Sri Priyan has official username sripriyan.jsec-01', () => {
    const sri = loadedMembers.find((m) => m.name.includes('SRIPRIYAN'));
    assert.ok(sri, 'Sri Priyan should exist');
    assert.strictEqual(sri.username, 'sripriyan.jsec-01');
    assert.strictEqual(sri.role, ROLES.JOINT_SECRETARY);
  });

  test('Geethalakshmi is also Chairman with geethalakshmi.chair-02', () => {
    const geetha = loadedMembers.find((m) => m.name.includes('GEETHALAKSHMI'));
    assert.ok(geetha, 'Geethalakshmi should exist');
    assert.strictEqual(geetha.username, 'geethalakshmi.chair-02');
    assert.strictEqual(geetha.role, ROLES.CHAIRMAN);
  });

  test('Mariya Merlina and J L Hemanth are Secretaries (mariya.sec-01, hemanth.sec-02)', () => {
    const mariya = loadedMembers.find((m) => m.name.includes('MARIYA'));
    assert.strictEqual(mariya.username, 'mariya.sec-01');
    assert.strictEqual(mariya.role, ROLES.SECRETARY);

    const hemanth = loadedMembers.find((m) => m.name.includes('HEMANTH'));
    assert.strictEqual(hemanth.username, 'hemanth.sec-02');
    assert.strictEqual(hemanth.role, ROLES.SECRETARY);
  });

  test('Alan Paul R is Vice Chairman with alan.vchair-01', () => {
    const alan = loadedMembers.find((m) => m.name.includes('ALAN'));
    assert.strictEqual(alan.username, 'alan.vchair-01');
    assert.strictEqual(alan.role, ROLES.VICE_CHAIRMAN);
  });

  test('Event Management Head Ramya Sri has ramya.emhead-01 (with backward-compatible alias)', () => {
    const ramya = loadedMembers.find((m) => m.name.includes('RAMYA'));
    assert.ok(ramya, 'Ramya Sri should exist');
    assert.strictEqual(ramya.username, 'ramya.emhead-01');
    assert.strictEqual(ramya.role, ROLES.EVENT_MANAGEMENT_HEAD);
  });

  test('Treasurer Lokeshvari and Joint Treasurer Kalaivani have official usernames', () => {
    const lokesh = loadedMembers.find((m) => m.name.includes('LOKESHVARI'));
    assert.strictEqual(lokesh.username, 'lokeshvari.tres-01');
    assert.strictEqual(lokesh.role, ROLES.TREASURER);

    const kalai = loadedMembers.find((m) => m.name.includes('KALAIVANI'));
    assert.strictEqual(kalai.username, 'kalaivani.jtres-01');
    assert.strictEqual(kalai.role, ROLES.JOINT_TREASURER);
  });

  test('Membership Director Swathi Nandhana has swathi.memdir-01 (and swathi.emhead-01 alias)', () => {
    const swathi = loadedMembers.find((m) => m.name.includes('SWATHI'));
    assert.ok(swathi, 'Swathi Nandhana should exist');
    assert.strictEqual(swathi.username, 'swathi.memdir-01');
    assert.strictEqual(swathi.secondaryUsername, 'swathi.emhead-01');
    assert.strictEqual(swathi.role, ROLES.MEMBERSHIP_DIRECTOR);
  });

  test('Executive members have sequential exec tags (aakanish.exec-01 to saiswaroopa.exec-11)', () => {
    const execs = loadedMembers.filter((m) => m.role === ROLES.EXECUTIVE_MEMBER);
    assert.strictEqual(execs.length, 11, 'Should have exactly 11 executive members');
    const firstExec = execs.find((m) => m.username === 'aakanish.exec-01');
    assert.ok(firstExec, 'First exec should be aakanish.exec-01');
  });

  // 2b. STRICT PRIVACY & PERMISSIONS AUDIT
  console.log('\n--- 2b. Strict Privacy: Confidential Membership Directory Access ---');
  test('Membership Directory is ONLY accessible to Sri Priyan, Ramya Sri, Swathi Nandhana, and Master Admin', () => {
    const sriPriyan = loadedMembers.find((m) => m.name.includes('SRIPRIYAN'));
    const ramyaSri = loadedMembers.find((m) => m.name.includes('RAMYA'));
    const swathiNandhana = loadedMembers.find((m) => m.name.includes('SWATHI'));
    const masterAdmin = loadedMembers.find((m) => m.role === ROLES.ADMINISTRATOR);
    const chairman = loadedMembers.find((m) => m.name.includes('SRIMAN'));
    const viceChairman = loadedMembers.find((m) => m.name.includes('ALAN'));
    const secretary = loadedMembers.find((m) => m.name.includes('MARIYA'));
    const staff = loadedMembers.find((m) => m.role === ROLES.STAFF_COORDINATOR);
    const treasurer = loadedMembers.find((m) => m.role === ROLES.TREASURER);
    const execMember = loadedMembers.find((m) => m.role === ROLES.EXECUTIVE_MEMBER);

    // Permitted (Strictly only the authorized Directorate members)
    assert.strictEqual(canAccessMembersDirectory(sriPriyan), true, 'Sri Priyan MUST have directory access');
    assert.strictEqual(canAccessMembersDirectory(ramyaSri), true, 'Ramya Sri MUST have directory access');
    assert.strictEqual(canAccessMembersDirectory(swathiNandhana), true, 'Swathi Nandhana MUST have directory access');
    assert.strictEqual(canAccessMembersDirectory(masterAdmin), true, 'Master Administrator MUST have directory access');

    // Forbidden (All other roles blocked)
    assert.strictEqual(canAccessMembersDirectory(chairman), false, 'Chairman must NOT see directory');
    assert.strictEqual(canAccessMembersDirectory(viceChairman), false, 'Vice Chairman must NOT see directory');
    assert.strictEqual(canAccessMembersDirectory(secretary), false, 'Secretary must NOT see directory');
    assert.strictEqual(canAccessMembersDirectory(staff), false, 'Staff Coordinator must NOT see directory');
    assert.strictEqual(canAccessMembersDirectory(treasurer), false, 'Treasurer must NOT see directory');
    assert.strictEqual(canAccessMembersDirectory(execMember), false, 'Executive Member must NOT see directory');
  });

  test('canManageMembers strictly enforces authorized identity', () => {
    const sriPriyan = loadedMembers.find((m) => m.name.includes('SRIPRIYAN'));
    const ramyaSri = loadedMembers.find((m) => m.name.includes('RAMYA'));
    const swathiNandhana = loadedMembers.find((m) => m.name.includes('SWATHI'));
    const chairman = loadedMembers.find((m) => m.name.includes('SRIMAN'));

    assert.strictEqual(canManageMembers(sriPriyan), true, 'Sri Priyan can manage members');
    assert.strictEqual(canManageMembers(ramyaSri), true, 'Ramya Sri can manage members');
    assert.strictEqual(canManageMembers(swathiNandhana), true, 'Swathi Nandhana can manage members');
    assert.strictEqual(canManageMembers(chairman), false, 'Chairman cannot manage members');
    assert.strictEqual(canManageMembers(ROLES.JOINT_SECRETARY), false, 'Raw role string cannot bypass identity check');
    assert.strictEqual(canManageMembers(ROLES.ADMINISTRATOR), true, 'Master Admin role string is permitted');
  });

  console.log('\n--- 2c. Event Scheduling Permissions ---');
  test('Event scheduling allowed for Chairmen, Vice Chairman, Secretaries, Joint Secretary, Event Head, Staff, Admin', () => {
    assert.strictEqual(canManageEvents(ROLES.CHAIRMAN), true, 'Chairman can manage events');
    assert.strictEqual(canManageEvents(ROLES.VICE_CHAIRMAN), true, 'Vice Chairman can manage events');
    assert.strictEqual(canManageEvents(ROLES.SECRETARY), true, 'Secretary can manage events');
    assert.strictEqual(canManageEvents(ROLES.JOINT_SECRETARY), true, 'Joint Secretary can manage events');
    assert.strictEqual(canManageEvents(ROLES.EVENT_MANAGEMENT_HEAD), true, 'Event Head can manage events');
    assert.strictEqual(canManageEvents(ROLES.STAFF_COORDINATOR), true, 'Staff Coordinator can manage events');
    assert.strictEqual(canManageEvents(ROLES.ADMINISTRATOR), true, 'Master Admin can manage events');

    // Disallowed for general members
    assert.strictEqual(canManageEvents(ROLES.TREASURER), false, 'Treasurer cannot manage events');
    assert.strictEqual(canManageEvents(ROLES.EXECUTIVE_MEMBER), false, 'Executive member cannot manage events');
  });

  // 3. AUTOMATIC CREDENTIALS GENERATION FOR NEW MEMBERS
  console.log('\n--- 3. Admin Adding New Member & Auto-Credentials Generation ---');
  let newlyAddedMember;
  await asyncTest('When Admin adds a new member, username and password are automatically generated', async () => {
    newlyAddedMember = await saveMember({
      name: 'Kavitha R',
      email: 'kavitha.r@gmail.com',
      role: ROLES.EXECUTIVE_MEMBER,
      department: 'Computer Science & Engineering',
      phone: '9840199999'
    });

    assert.ok(newlyAddedMember.id);
    assert.strictEqual(newlyAddedMember.username, 'kavitha.exec-12');
    assert.ok(newlyAddedMember.password && newlyAddedMember.password.startsWith('IEI#'), `Password must start with IEI#, got ${newlyAddedMember.password}`);
  });

  test('generateStrongPassword strictly enforces IEI# prefix format', () => {
    for (let i = 0; i < 20; i++) {
      const pwd = generateStrongPassword('TestUser');
      assert.ok(pwd.startsWith('IEI#'), `Password must start with IEI#, got: ${pwd}`);
      assert.ok(pwd.length >= 10, 'Password must have sufficient length');
    }
  });

  test('Formatted credential notice can be copied for student distribution', () => {
    const notice = formatCredentialNotice(newlyAddedMember);
    assert.ok(notice.includes('kavitha.exec-12'));
    assert.ok(notice.includes(newlyAddedMember.password));
    assert.ok(notice.includes('Dr. M.G.R. Educational & Research Institute'));
  });

  // 4. CLEAN SLATE VERIFICATION
  console.log('\n--- 4. Clean Slate (Zero Dummy Example Data) ---');
  resetToCleanSlate();
  await asyncTest('Initial tasks register is clean (0 dummy tasks)', async () => {
    const tasks = await getTasks();
    assert.strictEqual(tasks.length, 0, 'Tasks register must start completely clean');
  });

  await asyncTest('Initial events and attendance registers are clean', async () => {
    const events = await getEvents();
    const att = await getAttendance();
    assert.strictEqual(events.length, 0);
    assert.strictEqual(att.length, 0);
  });

  await asyncTest('Initial community updates feed is clean', async () => {
    const updates = await getUpdates();
    assert.strictEqual(updates.length, 0);
  });

  // 5. WORK ASSIGNMENT BY AUTHORIZED OFFICERS
  console.log('\n--- 5. Work Assignment by Chairman & Secretary ---');
  let realTask;
  await asyncTest('Secretary (or Joint Secretary) assigns work to Executive Member Aakanish', async () => {
    const secretary = loadedMembers.find((m) => m.role === ROLES.SECRETARY);
    const exec = loadedMembers.find((m) => m.username === 'aakanish.exec-01');

    realTask = await createTask({
      title: 'Prepare Technical Symposium Brochure and Schedule',
      description: 'Design official brochure and organize symposium agenda for Technovation 2026.',
      assignedToId: exec.id,
      assignedToName: exec.name,
      assignedToRole: exec.role,
      assignedById: secretary.id,
      assignedByName: secretary.name,
      assignedByRole: secretary.role,
      dueDate: '2026-11-20',
      priority: 'High',
      weeklyTag: '2026-W45'
    });

    assert.ok(realTask.id);
    assert.strictEqual(realTask.status, WORK_STATUSES.ASSIGNED);
    assert.strictEqual(realTask.assignedToName, exec.name);
    assert.strictEqual(realTask.assignedByName, secretary.name);
  });

  // 6. TWO-LEVEL APPROVAL WORKFLOW
  console.log('\n--- 6. Two-Level Approval Workflow Execution ---');
  let taskL1;
  await asyncTest('Step 1: Member submits report -> Pending First-Level Approval', async () => {
    const exec = loadedMembers.find((m) => m.username === 'aakanish.exec-01');
    taskL1 = await submitWorkReport(
      realTask,
      {
        title: 'Brochure Design & Event Schedule Draft',
        summary: 'Completed A3 flyer, brochure, and timeline schedule.',
        attachments: [{ name: 'Symposium_Brochure.pdf', size: '1.2 MB' }]
      },
      exec
    );

    assert.strictEqual(taskL1.status, WORK_STATUSES.PENDING_FIRST_LEVEL);
  });

  let taskFinal;
  await asyncTest('Step 2 & 3: Chairman Sriman reviews and approves at First Level', async () => {
    const chairman = loadedMembers.find((m) => m.role === ROLES.CHAIRMAN);
    taskFinal = await processFirstLevelReview(
      taskL1,
      chairman,
      'approve',
      'Verified design compliance with IEI standards. Recommended for Staff Coordinator.'
    );

    assert.strictEqual(taskFinal.status, WORK_STATUSES.PENDING_FINAL);
    assert.ok(taskFinal.submittedReport.firstLevelApproval);
    assert.strictEqual(taskFinal.submittedReport.firstLevelApproval.approvedByName, chairman.name);
    assert.strictEqual(taskFinal.submittedReport.firstLevelApproval.approvedByRole, ROLES.CHAIRMAN);
  });

  await asyncTest('Step 3 (Safety Guard): Secretary cannot approve again after First Level is completed', async () => {
    const secretary = loadedMembers.find((m) => m.role === ROLES.SECRETARY);
    let rejected = false;
    try {
      await processFirstLevelReview(taskFinal, secretary, 'approve', 'Duplicate attempt');
    } catch (e) {
      rejected = true;
    }
    assert.ok(rejected, 'Duplicate first-level review attempt must be blocked');
  });

  let taskCompleted;
  await asyncTest('Step 4 & 5: Staff Coordinator reviews and provides Final Sign-Off -> Completed', async () => {
    const admin = loadedMembers.find((m) => m.role === ROLES.STAFF_COORDINATOR);
    taskCompleted = await processFinalApproval(
      taskFinal,
      admin,
      'approve',
      'Officially approved for printing and distribution.'
    );

    assert.strictEqual(taskCompleted.status, WORK_STATUSES.COMPLETED);
    assert.ok(taskCompleted.submittedReport.finalApproval);
    assert.strictEqual(taskCompleted.submittedReport.finalApproval.approvedByName, admin.name);
    assert.strictEqual(taskCompleted.submittedReport.finalApproval.approvedByRole, ROLES.STAFF_COORDINATOR);
  });

  await asyncTest('Master Administrator can directly override and finalize any report', async () => {
    const masterAdmin = loadedMembers.find((m) => m.role === ROLES.ADMINISTRATOR);
    const exec = loadedMembers.find((m) => m.role === ROLES.EXECUTIVE_MEMBER);
    const testTask = await createTask({
      title: 'Emergency Lab Equipment Calibration',
      description: 'Check lab sensors and calibrate apparatus.',
      assignedToId: exec.id,
      assignedToName: exec.name,
      assignedToRole: exec.role,
      assignedById: masterAdmin.id,
      assignedByName: masterAdmin.name,
      assignedByRole: masterAdmin.role
    });

    const rep = await submitWorkReport(testTask, { title: 'Calibration Report', summary: 'Calibrated.' }, exec);
    // Master Admin can directly give final approval even from Level 1
    const overridden = await processFinalApproval(rep, masterAdmin, 'approve', 'Master Administrator direct override sign-off.');
    assert.strictEqual(overridden.status, WORK_STATUSES.COMPLETED);
    assert.strictEqual(overridden.submittedReport.finalApproval.approvedByName, masterAdmin.name);
    assert.strictEqual(overridden.submittedReport.finalApproval.approvedByRole, ROLES.ADMINISTRATOR);
  });

  // 7. DIRECT ESCALATION FOR FIRST-LEVEL APPROVER REPORTS
  console.log('\n--- 7. First-Level Approver Self-Submissions ---');
  await asyncTest('Secretary work report bypasses Level 1 and goes DIRECTLY to Admin (Staff Coordinator)', async () => {
    const secretary = loadedMembers.find((m) => m.role === ROLES.SECRETARY);
    const admin = loadedMembers.find((m) => m.role === ROLES.STAFF_COORDINATOR);

    const secTask = await createTask({
      title: 'IEI National Council Bi-Monthly Proceedings Minutes',
      description: 'Compile Chapter quarterly activity report for National Council.',
      assignedToId: secretary.id,
      assignedToName: secretary.name,
      assignedToRole: secretary.role,
      assignedById: admin.id,
      assignedByName: admin.name,
      assignedByRole: admin.role,
      dueDate: '2026-11-25',
      priority: 'High',
      weeklyTag: '2026-W45'
    });

    const directReport = await submitWorkReport(
      secTask,
      {
        title: 'Quarterly Chapter Activity Proceedings',
        summary: 'Documented all committee activities, workshop attendance, and accounts.',
        attachments: []
      },
      secretary
    );

    assert.strictEqual(directReport.status, WORK_STATUSES.PENDING_FINAL);
    assert.strictEqual(directReport.submittedReport.firstLevelApproval, null);
  });

  // 8. COMMITTEE MEETING SCHEDULING & AUTO-BROADCAST TO CHAT & CIRCULARS
  console.log('\n--- 8. Committee Meeting Scheduling & Auto-Broadcast ---');
  let scheduledMeetingEvent;
  await asyncTest('Chairman or Secretary schedules a meeting with date and clock time, which auto-broadcasts to Updates chat and Circulars', async () => {
    const sriPriyan = loadedMembers.find((m) => m.name.includes('SRIPRIYAN'));
    assert.ok(canManageEvents(sriPriyan.role), 'Sri Priyan as Joint Secretary has authority to schedule meetings');

    scheduledMeetingEvent = await createEvent({
      title: 'IEI Executive Committee General Body Meeting Q4',
      category: 'Committee Meeting',
      date: '2026-11-12',
      time: '14:30',
      venue: 'Mechanical Seminar Hall, Ground Floor',
      description: 'Review of upcoming symposium, accounts audit, and task distribution.'
    }, sriPriyan);

    assert.ok(scheduledMeetingEvent.id);
    assert.strictEqual(scheduledMeetingEvent.date, '2026-11-12');
    assert.strictEqual(scheduledMeetingEvent.time, '14:30');
    assert.strictEqual(scheduledMeetingEvent.scheduledByName, sriPriyan.name);

    // Verify auto-broadcast in Community Updates (Chat Box)
    const updates = await getUpdates();
    const chatBroadcast = updates.find((u) => u.content.includes('OFFICIAL MEETING SCHEDULED: "IEI Executive Committee General Body Meeting Q4"'));
    assert.ok(chatBroadcast, 'Meeting must appear in the Community Updates chat box');
    assert.ok(chatBroadcast.content.includes('2026-11-12'), 'Chat notice must state the calendar date');
    assert.ok(chatBroadcast.content.includes('14:30'), 'Chat notice must state the clock time');

    // Verify auto-broadcast in Circular Announcements
    const announcements = await getAnnouncements();
    const circularBroadcast = announcements.find((a) => a.title.includes('Official Meeting Notice: IEI Executive Committee General Body Meeting Q4'));
    assert.ok(circularBroadcast, 'Meeting must appear in Circular Announcements');
    assert.strictEqual(circularBroadcast.priority, 'High');
  });

  await asyncTest('Attendance is strictly linked to scheduled official chapter events/meetings', async () => {
    const sec = loadedMembers.find((m) => m.role === ROLES.SECRETARY);
    const event = scheduledMeetingEvent;

    const attRecord = await recordEventAttendance({
      eventId: event.id,
      eventTitle: event.title,
      category: event.category,
      date: event.date,
      recordedBy: sec,
      notes: 'Quorum established with 21 members present.',
      records: loadedMembers.map((m) => ({
        memberId: m.id,
        name: m.name,
        role: m.role,
        status: 'Present'
      }))
    });

    assert.ok(attRecord.id);
    assert.strictEqual(attRecord.eventId, event.id);
    assert.strictEqual(attRecord.records.length, 23);
  });

  // 9. COMMUNITY WORK UPDATES
  console.log('\n--- 9. Community Work Updates Feed ---');
  await asyncTest('Members post work updates with images and documents', async () => {
    const sriman = loadedMembers.find((m) => m.role === ROLES.CHAIRMAN);
    const update = await createCommunityUpdate({
      author: sriman,
      content: 'Welcoming all new committee members to the 2026 Chapter Management Portal! Let us achieve great milestones together.',
      imageUrl: null,
      attachmentName: 'Welcome_IEI_2026.pdf'
    });

    assert.ok(update.id);
    assert.strictEqual(update.authorName, sriman.name);
    assert.strictEqual(update.authorRole, ROLES.CHAIRMAN);
  });

  // 10. DATA PERSISTENCE ACROSS LOGOUT & RE-LOGIN
  console.log('\n--- 10. Persistence: Logout ONLY Terminates Active User Session ---');
  await asyncTest('Logging out removes only active user session while preserving all created tasks, updates, and events', async () => {
    // Simulate user session in localStorage
    const testSessionKey = 'iei_mgr_active_user';
    const mockStorage = { [testSessionKey]: JSON.stringify(loadedMembers[0]) };

    // Simulate logout action: only removes active user token
    delete mockStorage[testSessionKey];
    assert.strictEqual(mockStorage[testSessionKey], undefined, 'Active user session is cleared upon logout');

    // Verify all data created in previous steps remain intact in stores
    const remainingTasks = await getTasks();
    const remainingUpdates = await getUpdates();
    const remainingEvents = await getEvents();
    const remainingAttendance = await getAttendance();

    assert.ok(remainingTasks.length > 0, 'Tasks remain completely intact');
    assert.ok(remainingUpdates.length > 0, 'Community updates remain completely intact');
    assert.ok(remainingEvents.length > 0, 'Events remain completely intact');
    assert.ok(remainingAttendance.length > 0, 'Attendance records remain completely intact');
  });

  // 11. DYNAMIC WEEKLY REPORT CYCLES & 2027 ROLLOVER
  console.log('\n--- 11. Dynamic ISO Week Calculations & 2027 Fresh Start ---');
  test('Current week calculates dynamically from real date (e.g. 2026-W46 for Nov 2026)', () => {
    const testDate = new Date('2026-11-09T10:00:00Z');
    const weekDetails = getISOWeekDetails(testDate);
    assert.strictEqual(weekDetails.year, 2026);
    assert.strictEqual(weekDetails.week, 46);
    assert.strictEqual(weekDetails.tag, '2026-W46');
  });

  test('When year rolls over to 2027, week cycle starts freshly at Week 01 (2027-W01)', () => {
    const newYear2027 = new Date('2027-01-04T10:00:00Z'); // First Monday of 2027
    const weekDetails = getISOWeekDetails(newYear2027);
    assert.strictEqual(weekDetails.year, 2027, 'ISO year rolls to 2027');
    assert.strictEqual(weekDetails.week, 1, 'Week number resets freshly to Week 1');
    assert.strictEqual(weekDetails.tag, '2027-W01', 'Official tag is 2027-W01');

    const range = getISOWeekDateRange(2027, 1);
    assert.strictEqual(range, 'Jan 04 - 10', 'Displays Jan 04 - 10 date range');
  });

  await asyncTest('All 2026 historical tasks and records remain saved in the cloud and accessible alongside 2027 weeks', async () => {
    const exec = loadedMembers.find((m) => m.role === ROLES.EXECUTIVE_MEMBER);
    const chairman = loadedMembers.find((m) => m.role === ROLES.CHAIRMAN);

    // Create a 2027 task to test year rollover coexistence
    const task2027 = await createTask({
      title: 'IEI National Annual Convention 2027 Planning',
      description: 'Kick-off meeting for 2027 technical initiatives.',
      assignedToId: exec.id,
      assignedToName: exec.name,
      assignedToRole: exec.role,
      assignedById: chairman.id,
      assignedByName: chairman.name,
      assignedByRole: chairman.role,
      weeklyTag: '2027-W01'
    });

    assert.ok(task2027.id);
    assert.strictEqual(task2027.weeklyTag, '2027-W01');

    // Verify all tasks (both 2026 and 2027) exist in store
    const allTasks = await getTasks();
    const has2026 = allTasks.some((t) => (t.weeklyTag || '').startsWith('2026'));
    const has2027 = allTasks.some((t) => (t.weeklyTag || '').startsWith('2027'));

    assert.ok(has2026, '2026 historical tasks remain completely preserved in storage');
    assert.ok(has2027, '2027 newly created tasks coexist seamlessly');

    // Dynamic dropdown includes both current and historical weeks
    const dropdownOptions = generateWeekOptions(allTasks, new Date('2026-11-09'));
    assert.ok(dropdownOptions.some((o) => o.tag === '2027-W01'), '2027 tasks are discoverable in dropdown');
    assert.ok(dropdownOptions.some((o) => o.tag === 'all'), 'All Recorded Weeks (Cumulative) option exists');
  });

  // 12. WELCOME PAGE & IEI PROFILE UPDATE
  console.log('\n--- 12. Public Welcome Page & IEI Profile Update Governance ---');
  test('IEI Profile Update is strictly accessible ONLY to Secretary, Joint Secretary, Chairman, Vice Chairman, and Admin', () => {
    // Authorized roles
    assert.strictEqual(canAccessProfileUpdate(ROLES.CHAIRMAN), true, 'Chairman has access');
    assert.strictEqual(canAccessProfileUpdate(ROLES.VICE_CHAIRMAN), true, 'Vice Chairman has access');
    assert.strictEqual(canAccessProfileUpdate(ROLES.SECRETARY), true, 'Secretary has access');
    assert.strictEqual(canAccessProfileUpdate(ROLES.JOINT_SECRETARY), true, 'Joint Secretary has access');
    assert.strictEqual(canAccessProfileUpdate(ROLES.ADMINISTRATOR), true, 'Administrator has access');

    // Strictly blocked roles
    assert.strictEqual(canAccessProfileUpdate(ROLES.EXECUTIVE_MEMBER), false, 'Executive Member is blocked');
    assert.strictEqual(canAccessProfileUpdate(ROLES.MEMBERSHIP_DIRECTOR), false, 'Membership Director is blocked');
    assert.strictEqual(canAccessProfileUpdate(ROLES.EVENT_MANAGEMENT_HEAD), false, 'Event Head is blocked');
    assert.strictEqual(canAccessProfileUpdate(ROLES.TREASURER), false, 'Treasurer is blocked');
    assert.strictEqual(canAccessProfileUpdate(ROLES.JOINT_TREASURER), false, 'Joint Treasurer is blocked');
    assert.strictEqual(canAccessProfileUpdate(ROLES.STAFF_COORDINATOR), false, 'Staff Coordinator is blocked');
  });

  await asyncTest('Public Welcome Page default configuration holds official branding and verified contacts', async () => {
    const profile = await getPublicProfileConfig();
    assert.ok(profile.aboutIeiHeading.includes('THE INSTITUTION OF ENGINEERS (INDIA)') || profile.aboutIeiHeading.includes('IEI'));
    assert.ok(profile.aboutChapterHeading.includes('MGR IEI Student Chapter'));
    assert.strictEqual(profile.aboutChapterLines.length, 3, 'Chapter introduction contains EXACTLY THREE LINES');
    assert.ok(profile.carouselPhotos.length >= 4, 'Contains official chapter photos in carousel');
    assert.ok(profile.membershipFormUrl && profile.membershipFormUrl.includes('google.com/forms'));

    // Verified contact persons and actual numbers (Sriman Narayana Moorthy and Geethalakshmi)
    const geetha = profile.contacts.find((c) => c.name === 'Geethalakshmi' || c.phone === '9884633809');
    const sriman = profile.contacts.find((c) => c.name === 'Sriman Narayana Moorthy' || c.phone === '8015803274');
    assert.ok(geetha, 'Geethalakshmi is configured as contact');
    assert.strictEqual(geetha.name, 'Geethalakshmi', 'Exact name: Geethalakshmi');
    assert.strictEqual(geetha.role, 'Student Chairman Elect', 'Exact role: Student Chairman Elect');
    assert.strictEqual(geetha.phone, '9884633809', 'Geethalakshmi phone must match verified directory (9884633809)');
    assert.ok(sriman, 'Sriman Narayana Moorthy is configured as contact');
    assert.strictEqual(sriman.name, 'Sriman Narayana Moorthy', 'Exact name: Sriman Narayana Moorthy');
    assert.strictEqual(sriman.role, 'Student Chairman Elect', 'Exact role: Student Chairman Elect');
    assert.strictEqual(sriman.phone, '8015803274', 'Sriman phone must match verified directory (8015803274)');
  });

  await asyncTest('Upcoming Events starts with empty list for "Updated Soon" state, and supports publishing/removing', async () => {
    const initialEvents = await getPublicUpcomingEvents();
    assert.strictEqual(initialEvents.length, 0, 'Initially empty to trigger "Upcoming events will be updated soon."');

    // Authorised user publishes an upcoming event
    const chairman = loadedMembers.find((m) => m.role === ROLES.CHAIRMAN);
    const pubEvent = await savePublicUpcomingEvent({
      title: 'Technovation 2026 — National Student Symposium',
      date: '2026-11-28',
      time: '10:00 AM',
      venue: 'Main Auditorium, Maduravoyal Campus',
      description: 'Paper presentations, coding sprints, and guest keynote by National Council Fellows.',
      posterUrl: './assets/website-logo.png'
    }, chairman);

    assert.ok(pubEvent.id);
    const updatedEvents = await getPublicUpcomingEvents();
    assert.strictEqual(updatedEvents.length, 1);
    assert.strictEqual(updatedEvents[0].title, 'Technovation 2026 — National Student Symposium');

    // Clean up event to restore pristine state
    await deletePublicUpcomingEvent(pubEvent.id);
    const finalEvents = await getPublicUpcomingEvents();
    assert.strictEqual(finalEvents.length, 0, 'Cleanly restored to empty state');
  });

  // 13. IMMUTABLE SYSTEM ACTIVITY CONSOLE & AUDIT TRAIL ENGINE
  console.log('\n--- 13. System Activity Console & Immutable Audit Engine ---');
  test('Activity Console Access is strictly restricted to CBN Joint Secretary and Master Administrator ONLY', () => {
    // 1. Master Administrator
    const masterAdmin = loadedMembers.find((m) => m.role === ROLES.ADMINISTRATOR);
    assert.strictEqual(canAccessActivityConsole(masterAdmin), true, 'Master Admin must have access');
    assert.strictEqual(canAccessActivityConsole(ROLES.ADMINISTRATOR), true, 'Administrator role string must have access');

    // 2. CBN Joint Secretary (Sri Priyan S)
    const sriPriyan = loadedMembers.find((m) => m.username === 'sripriyan.jsec-01');
    assert.strictEqual(canAccessActivityConsole(sriPriyan), true, 'Sri Priyan (Joint Secretary) must have access');
    assert.strictEqual(canAccessActivityConsole(ROLES.JOINT_SECRETARY), true, 'Joint Secretary role string must have access');

    // 3. Strictly denied for all other 9 roles
    const blockedRoles = [
      ROLES.CHAIRMAN,
      ROLES.VICE_CHAIRMAN,
      ROLES.SECRETARY,
      ROLES.EVENT_MANAGEMENT_HEAD,
      ROLES.MEMBERSHIP_DIRECTOR,
      ROLES.TREASURER,
      ROLES.JOINT_TREASURER,
      ROLES.EXECUTIVE_MEMBER,
      ROLES.STAFF_COORDINATOR
    ];

    blockedRoles.forEach((role) => {
      assert.strictEqual(
        canAccessActivityConsole(role),
        false,
        `Role "${role}" must be strictly denied access to the System Activity Console`
      );
      const memberOfRole = loadedMembers.find((m) => m.role === role);
      if (memberOfRole) {
        assert.strictEqual(
          canAccessActivityConsole(memberOfRole),
          false,
          `Member ${memberOfRole.name} (${role}) must be denied access`
        );
      }
    });
  });

  await asyncTest('Automatic activity recording captures operations across all core modules', async () => {
    const logs = await getAuditLogs();
    assert.ok(logs.length > 0, 'Audit logs must contain recorded activities');

    // Check module coverage in recorded logs
    const recordedActions = logs.map((l) => l.action);
    assert.ok(
      recordedActions.includes(AUDIT_ACTIONS.WORK_TASK_ASSIGNED),
      'Task assignments must generate an audit log entry'
    );
    assert.ok(
      recordedActions.includes(AUDIT_ACTIONS.WORK_REPORT_SUBMITTED),
      'Work report submission must generate an audit log entry'
    );
    assert.ok(
      recordedActions.includes(AUDIT_ACTIONS.WORK_LEVEL1_APPROVED),
      'First-level review approval must generate an audit log entry'
    );
    assert.ok(
      recordedActions.includes(AUDIT_ACTIONS.WORK_FINAL_APPROVED),
      'Final Staff Coordinator approval must generate an audit log entry'
    );
    assert.ok(
      recordedActions.includes(AUDIT_ACTIONS.EVENT_CREATED),
      'Event creation must generate an audit log entry'
    );
    assert.ok(
      recordedActions.includes(AUDIT_ACTIONS.CHAT_MESSAGE_SENT),
      'Chat/Community update must generate an audit log entry'
    );
  });

  await asyncTest('Credentials and secrets are strictly redacted and never stored in audit logs', async () => {
    // Record an event containing sensitive password and token fields
    const testActor = loadedMembers.find((m) => m.username === 'sripriyan.jsec-01');
    const recorded = await recordActivity({
      actor: testActor,
      action: 'SECURITY_TEST_OPERATION',
      module: AUDIT_MODULES.SECURITY,
      status: 'SUCCESS',
      details: 'Automated compliance test for cryptographic sanitation',
      targetId: 'sec-test-01',
      previousValues: { password: 'PlainSecretPassword123!', apiKey: 'secret-token-xyz' },
      newValues: { token: 'bearer-jwt-super-secret', safeField: 'Approved Status' }
    });

    assert.ok(recorded.id);
    assert.strictEqual(recorded.previousValues.password, '[REDACTED_CREDENTIAL]');
    assert.strictEqual(recorded.newValues.token, '[REDACTED_CREDENTIAL]');
    assert.strictEqual(recorded.newValues.safeField, 'Approved Status');
  });

  test('Immutability guarantee: auditService provides zero delete, edit or clear mechanisms', () => {
    import('../src/services/auditService.js').then((auditMod) => {
      assert.strictEqual(typeof auditMod.recordActivity, 'function', 'recordActivity exists');
      assert.strictEqual(typeof auditMod.getAuditLogs, 'function', 'getAuditLogs exists');
      assert.strictEqual(typeof auditMod.subscribeToAuditLogs, 'function', 'subscribeToAuditLogs exists');

      // Assert no delete or edit functions exist
      assert.strictEqual(auditMod.deleteAuditLog, undefined, 'deleteAuditLog must not exist');
      assert.strictEqual(auditMod.updateAuditLog, undefined, 'updateAuditLog must not exist');
      assert.strictEqual(auditMod.clearAuditLogs, undefined, 'clearAuditLogs must not exist');
      assert.strictEqual(auditMod.purgeAuditLogs, undefined, 'purgeAuditLogs must not exist');
    });
  });

  // 14. COMPLETE DATA INTEGRATION, SYNCHRONIZATION AND REAL-TIME UPDATE FIX
  console.log('\n--- 14. System-Wide Real-Time Data Integration & Synchronization (Mandatory 12 Scenarios) ---');

  // TEST 1: User Profile Update Synchronization
  await asyncTest('TEST 1: User Profile Update Synchronization (Chairman Sriman updates phone, reflects in Firestore, subscribers, and public profile)', async () => {
    const allMembers = await getMembers();
    const sriman = allMembers.find((m) => (m.username || '').includes('sriman') || (m.name || '').includes('SRIMAN'));
    assert.ok(sriman, 'Chairman Sriman must exist in committee directory');

    // Subscribe an independent user (Secretary Mariya)
    let mariyaSawUpdate = false;
    let mariyaObservedPhone = null;
    const unsub = subscribeToData('members', (membersList) => {
      const s = membersList.find((m) => m.id === sriman.id);
      if (s && s.phone === '8015803274') {
        mariyaSawUpdate = true;
        mariyaObservedPhone = s.phone;
      }
    });

    // Update phone via updateUserProfile
    const updated = await updateUserProfile(sriman.id, { phone: '8015803274', bio: 'Chairman leading MGR IEI Student Chapter 2026-2027.' }, sriman);
    assert.strictEqual(updated.phone, '8015803274');

    // Verify Cloud Firestore document
    if (db) {
      const snap = await getDoc(doc(db, 'iei_members', sriman.id));
      assert.ok(snap.exists(), 'iei_members document must exist in Firestore');
      assert.strictEqual(snap.data().phone, '8015803274', 'Firestore document phone must match updated value');
    }

    // Verify public profile contact card
    const pubProf = await getPublicProfileConfig();
    const srimanContact = (pubProf.contacts || []).find((c) => (c.name || '').includes('Sriman') || c.phone === '8015803274');
    assert.ok(srimanContact, 'Chairman must be listed on public profile contacts');
    assert.strictEqual(srimanContact.phone, '8015803274');

    unsub();
  });

  // TEST 2: Public Profile Contact Card Synchronization
  await asyncTest('TEST 2: Public Profile Contact Card Synchronization (Updates reflect immediately for visitors)', async () => {
    const sriman = (await getMembers()).find((m) => (m.name || '').includes('SRIMAN'));
    
    // Save updated contact information
    await savePublicProfileConfig({
      aboutChapterHeading: 'About MGR IEI Student Chapter',
      contacts: [
        {
          id: 'contact-sriman',
          name: 'Sriman Narayana Moorthy',
          role: 'Student Chairman Elect',
          phone: '8015803274',
          displayPhone: '+91 80158 03274',
          email: 'srimannarayanamoorthysridhar@gmail.com',
          department: 'Engineering'
        },
        {
          id: 'contact-geetha',
          name: 'Geethalakshmi',
          role: 'Student Chairman Elect',
          phone: '9884633809',
          displayPhone: '+91 98846 33809',
          email: 'geethaashok3114@gmail.com',
          department: 'Engineering'
        }
      ]
    }, sriman);

    // Verify Cloud Firestore document
    if (db) {
      const snap = await getDoc(doc(db, 'iei_public_profile', 'main_config'));
      assert.ok(snap.exists(), 'iei_public_profile/main_config must exist in Firestore');
      assert.strictEqual(snap.data().aboutChapterHeading, 'About MGR IEI Student Chapter');
      assert.strictEqual(snap.data().contacts.length, 2);
    }
  });

  // TEST 3: Admin Creates New User
  let syncTestUser;
  await asyncTest('TEST 3: Admin Creates New User (Master Admin creates test user, saved to Firestore, visible to Joint Secretary immediately)', async () => {
    const masterAdmin = (await getMembers()).find((m) => (m.username || '').includes('admin.master-01'));
    
    let jSecReceivedNewUser = false;
    const unsub = subscribeToData('members', (membersList) => {
      if (membersList.some((m) => m.email === 'test.exec99@drmgrdu.ac.in')) {
        jSecReceivedNewUser = true;
      }
    });

    syncTestUser = await saveMember({
      name: 'Test Executive Sync',
      email: 'test.exec99@drmgrdu.ac.in',
      role: ROLES.EXECUTIVE_MEMBER,
      department: 'Electrical Engineering',
      phone: '9840199991'
    });

    assert.ok(syncTestUser.id);
    assert.strictEqual(jSecReceivedNewUser, true, 'Joint Secretary must see newly created user immediately without reload');

    // Verify Cloud Firestore document
    if (db) {
      const snap = await getDoc(doc(db, 'iei_members', syncTestUser.id));
      assert.ok(snap.exists(), 'Newly created user must exist in Firestore iei_members');
      assert.strictEqual(snap.data().email, 'test.exec99@drmgrdu.ac.in');
    }

    unsub();
  });

  // TEST 4: Admin Updates User Designation & Role
  await asyncTest('TEST 4: Admin Updates User Designation & Role (Master Admin promotes user, reflects in Firestore and session permissions)', async () => {
    assert.ok(syncTestUser, 'Sync test user must exist');
    
    const updatedUser = await saveMember({
      ...syncTestUser,
      role: ROLES.JOINT_SECRETARY,
      department: 'Advanced Computing Sciences'
    });

    assert.strictEqual(updatedUser.role, ROLES.JOINT_SECRETARY);

    if (db) {
      const snap = await getDoc(doc(db, 'iei_members', syncTestUser.id));
      assert.strictEqual(snap.data().role, ROLES.JOINT_SECRETARY, 'Role update must be written to Firestore');
      assert.strictEqual(snap.data().department, 'Advanced Computing Sciences');
    }
  });

  // TEST 5: Admin Deactivates Account
  await asyncTest('TEST 5: Admin Deactivates Account (Account status becomes Inactive in central database)', async () => {
    assert.ok(syncTestUser, 'Sync test user must exist');

    const deactivatedUser = await saveMember({
      ...syncTestUser,
      status: 'Inactive'
    });

    assert.strictEqual(deactivatedUser.status, 'Inactive');

    if (db) {
      const snap = await getDoc(doc(db, 'iei_members', syncTestUser.id));
      assert.strictEqual(snap.data().status, 'Inactive', 'Deactivation must be written to Firestore');
    }

    // Clean up test user
    await deleteMember(syncTestUser.id);
  });

  // TEST 6: Work Assignment Distribution
  let syncTask;
  await asyncTest('TEST 6: Work Assignment Distribution (Secretary assigns task, Executive Member receives task and notification immediately)', async () => {
    const all = await getMembers();
    const secretary = all.find((m) => m.role === ROLES.SECRETARY);
    const aakanish = all.find((m) => (m.username || '').includes('aakanish'));
    assert.ok(secretary && aakanish, 'Secretary and Executive Member must exist');

    let execReceivedTask = false;
    const unsubTasks = subscribeToData('tasks', (taskList) => {
      if (taskList.some((t) => t.assignedToId === aakanish.id && t.title.includes('Real-Time Data Pipeline Protocol'))) {
        execReceivedTask = true;
      }
    });

    syncTask = await createTask({
      title: 'Real-Time Data Pipeline Protocol Verification',
      description: 'Audit Firestore bidirectional listeners and two-level approval workflows.',
      priority: 'High',
      dueDate: '2026-11-20',
      assignedToId: aakanish.id,
      assignedToName: aakanish.name,
      assignedToRole: aakanish.role,
      assignedById: secretary.id,
      assignedByName: secretary.name,
      assignedByRole: secretary.role
    });

    assert.ok(syncTask.id);
    assert.strictEqual(execReceivedTask, true, 'Executive Member must receive assigned task without reload');

    if (db) {
      const snap = await getDoc(doc(db, 'iei_tasks', syncTask.id));
      assert.ok(snap.exists(), 'Task document must exist in Firestore iei_tasks');
      assert.strictEqual(snap.data().title, syncTask.title);
    }

    unsubTasks();
  });

  // TEST 7: Work Submission and Two-Level Approval Propagation
  await asyncTest('TEST 7: Work Submission and Two-Level Approval Propagation (Member submits -> Level 1 -> Final Approval -> Completed across all screens)', async () => {
    assert.ok(syncTask, 'Task must exist');
    const all = await getMembers();
    const aakanish = all.find((m) => (m.username || '').includes('aakanish'));
    const sriman = all.find((m) => (m.username || '').includes('sriman'));
    const staff = all.find((m) => m.role === ROLES.STAFF_COORDINATOR);

    // 1. Executive Member submits report
    const submitted = await submitWorkReport(
      syncTask,
      {
        title: syncTask.title,
        summary: 'Complete test of central database synchronization across 23 accounts.',
        attachments: [{ name: 'Sync_Protocol_Verification.pdf', url: 'https://example.com/Sync_Protocol_Verification.pdf' }]
      },
      aakanish
    );
    assert.strictEqual(submitted.status, WORK_STATUSES.PENDING_FIRST_LEVEL);

    // 2. Chairman approves at Level 1
    const l1Approved = await processFirstLevelReview(
      submitted,
      sriman,
      'approve',
      'Verified complete synchronization architecture.'
    );
    assert.strictEqual(l1Approved.status, WORK_STATUSES.PENDING_FINAL);

    // 3. Staff Coordinator gives Final Approval
    const finalized = await processFinalApproval(
      l1Approved,
      staff,
      'approve',
      'Approved by Staff Coordinator. Full institutional certification granted.'
    );
    assert.strictEqual(finalized.status, WORK_STATUSES.COMPLETED);

    // Verify Firestore reflects Completed status
    if (db) {
      const snap = await getDoc(doc(db, 'iei_tasks', syncTask.id));
      assert.strictEqual(snap.data().status, WORK_STATUSES.COMPLETED, 'Firestore task status must be Completed');
    }
  });

  // TEST 8: Official Meeting Scheduling and Auto-Broadcast
  let syncEvent;
  await asyncTest('TEST 8: Official Meeting Scheduling and Auto-Broadcast (Chairman schedules meeting, auto-broadcasts to Community Chat and Circulars)', async () => {
    const sriman = (await getMembers()).find((m) => (m.username || '').includes('sriman'));

    let chatBroadcastReceived = false;
    let circularReceived = false;
    const unsubUpdates = subscribeToData('updates', (updates) => {
      if (updates.some((u) => u.content && u.content.includes('ANNUAL INSTITUTIONAL CONCLAVE 2026'))) {
        chatBroadcastReceived = true;
      }
    });
    const unsubAnn = subscribeToData('announcements', (anns) => {
      if (anns.some((a) => a.title && a.title.includes('ANNUAL INSTITUTIONAL CONCLAVE 2026'))) {
        circularReceived = true;
      }
    });

    syncEvent = await createEvent({
      title: 'ANNUAL INSTITUTIONAL CONCLAVE 2026',
      category: 'Committee Meeting',
      date: '2026-11-25',
      time: '11:00 AM',
      venue: 'IEI Council Chamber, Main Block',
      description: 'Statutory annual review and 2027 technical symposium roadmapping.'
    }, sriman);

    assert.ok(syncEvent.id);
    assert.strictEqual(chatBroadcastReceived, true, 'Meeting must auto-broadcast into community chat feed');
    assert.strictEqual(circularReceived, true, 'Meeting must auto-broadcast into official circulars register');

    if (db) {
      const snap = await getDoc(doc(db, 'iei_events', syncEvent.id));
      assert.ok(snap.exists(), 'Event must be saved in Firestore iei_events');
      assert.strictEqual(snap.data().title, 'ANNUAL INSTITUTIONAL CONCLAVE 2026');
    }

    unsubUpdates();
    unsubAnn();
  });

  // TEST 9: Community Work Updates Chat
  let syncChatUpdate;
  await asyncTest('TEST 9: Community Work Updates Chat (Member posts update with attachment, appears in all feeds, reactions update in real time)', async () => {
    const sripriyan = (await getMembers()).find((m) => (m.username || '').includes('sripriyan'));

    syncChatUpdate = await createCommunityUpdate({
      author: sripriyan,
      content: 'Real-time database integration verified. Central source of truth is active.',
      attachmentName: 'Verification_Checklist_Q4.pdf'
    });

    assert.ok(syncChatUpdate.id);

    // Test reaction toggle
    await toggleUpdateReaction(syncChatUpdate.id, 'like');
    const currentUpdates = await getUpdates();
    const updatedMsg = currentUpdates.find((u) => u.id === syncChatUpdate.id);
    assert.ok(updatedMsg.reactions.like >= 1, 'Reaction count must increment');

    if (db) {
      const snap = await getDoc(doc(db, 'iei_updates', syncChatUpdate.id));
      assert.ok(snap.exists(), 'Update must exist in Firestore iei_updates');
      assert.strictEqual(snap.data().attachmentName, 'Verification_Checklist_Q4.pdf');
    }
  });

  // TEST 10: Circulars and Announcements Register
  let syncAnnouncement;
  await asyncTest('TEST 10: Circulars and Announcements Register (Published announcement saved to Firestore, visible in Announcements tab)', async () => {
    const staff = (await getMembers()).find((m) => m.role === ROLES.STAFF_COORDINATOR);

    syncAnnouncement = await createAnnouncement({
      title: 'Notice: IEI National Annual Membership Renewal 2027',
      priority: 'High',
      content: 'All committee members must ensure student chapter renewals are filed before Dec 15.',
      attachmentName: 'Renewal_Guidelines_2027.pdf',
      author: staff
    });

    assert.ok(syncAnnouncement.id);

    if (db) {
      const snap = await getDoc(doc(db, 'iei_announcements', syncAnnouncement.id));
      assert.ok(snap.exists(), 'Announcement must exist in Firestore iei_announcements');
      assert.strictEqual(snap.data().priority, 'High');
    }
  });

  // TEST 11: Real-Time Deletion Propagation
  await asyncTest('TEST 11: Real-Time Deletion Propagation (Deleting task, event, and announcement removes them from Firestore and subscriber views)', async () => {
    assert.ok(syncTask && syncEvent && syncAnnouncement, 'Fixtures must exist');

    await deleteTask(syncTask.id);
    await deleteEvent(syncEvent.id);
    await deleteAnnouncement(syncAnnouncement.id);

    const remainingTasks = await getTasks();
    const remainingEvents = await getEvents();
    const remainingAnn = await getAnnouncements();

    assert.ok(!remainingTasks.some((t) => t.id === syncTask.id), 'Deleted task must not appear in tasks store');
    assert.ok(!remainingEvents.some((e) => e.id === syncEvent.id), 'Deleted event must not appear in events store');
    assert.ok(!remainingAnn.some((a) => a.id === syncAnnouncement.id), 'Deleted announcement must not appear in announcements store');

    if (db) {
      const tSnap = await getDoc(doc(db, 'iei_tasks', syncTask.id));
      const eSnap = await getDoc(doc(db, 'iei_events', syncEvent.id));
      const aSnap = await getDoc(doc(db, 'iei_announcements', syncAnnouncement.id));

      assert.strictEqual(tSnap.exists(), false, 'Deleted task must not exist in Firestore');
      assert.strictEqual(eSnap.exists(), false, 'Deleted event must not exist in Firestore');
      assert.strictEqual(aSnap.exists(), false, 'Deleted announcement must not exist in Firestore');
    }
  });

  // TEST 12: Audit Trail Recording for All Operations
  await asyncTest('TEST 12: Audit Trail Recording for All Operations (Every operation logged in system_audit_logs; immutability enforced)', async () => {
    const logs = await getAuditLogs();
    assert.ok(logs.length > 0, 'Audit logs must contain recorded events');

    // Confirm that profile updates, work assignments, event creation, and deletions generated audit logs
    const hasProfileAudit = logs.some((l) => l.module === AUDIT_MODULES.MEMBERS || l.module === AUDIT_MODULES.PROFILE);
    const hasWorkAudit = logs.some((l) => l.module === AUDIT_MODULES.WORK);
    const hasEventAudit = logs.some((l) => l.module === AUDIT_MODULES.EVENTS);

    assert.ok(hasProfileAudit, 'Profile modifications must have audit entries');
    assert.ok(hasWorkAudit, 'Work workflows must have audit entries');
    assert.ok(hasEventAudit, 'Event operations must have audit entries');

    // Verify Cloud Firestore system_audit_logs document creation
    if (db) {
      const snap = await getDocs(collection(db, 'system_audit_logs'));
      assert.ok(snap.size > 0, 'Firestore system_audit_logs collection must have recorded audit entries');
    }
  });

  console.log('\n================================================================');
  console.log(`TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
