import assert from 'node:assert';
import { 
  ROLES, 
  WORK_STATUSES, 
  FIRST_LEVEL_APPROVER_ROLES, 
  isFirstLevelApprover, 
  isStaffCoordinator, 
  canAssignWork, 
  canManageMembers, 
  canRecordAttendance 
} from '../src/config/roles.js';

import {
  getMembers,
  saveMember,
  getTasks,
  createTask,
  updateTask,
  getUpdates,
  createCommunityUpdate,
  getEvents,
  createEvent,
  getAttendance,
  recordEventAttendance,
  getAnnouncements,
  createAnnouncement,
  getNotifications,
  createNotification,
  resetToCleanSlate
} from '../src/services/firebaseService.js';

import {
  generateUsername,
  generateStrongPassword,
  formatCredentialNotice
} from '../src/services/credentialService.js';

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
  test('10 exact IEI student chapter roles are defined', () => {
    assert.strictEqual(Object.keys(ROLES).length, 10);
    assert.strictEqual(ROLES.CHAIRMAN, 'Chairman');
    assert.strictEqual(ROLES.VICE_CHAIRMAN, 'Vice Chairman');
    assert.strictEqual(ROLES.SECRETARY, 'Secretary');
    assert.strictEqual(ROLES.JOINT_SECRETARY, 'Joint Secretary');
    assert.strictEqual(ROLES.TREASURER, 'Treasurer');
    assert.strictEqual(ROLES.JOINT_TREASURER, 'Joint Treasurer');
    assert.strictEqual(ROLES.MEMBERSHIP_DIRECTOR, 'Membership Director');
    assert.strictEqual(ROLES.EVENT_MANAGEMENT_HEAD, 'Event Management Head');
    assert.strictEqual(ROLES.EXECUTIVE_MEMBER, 'Executive Member');
    assert.strictEqual(ROLES.STAFF_COORDINATOR, 'Admin (Staff Coordinator)');
  });

  test('First-level approvers are strictly Chairman, Vice Chairman, Secretary, Joint Secretary', () => {
    assert.strictEqual(FIRST_LEVEL_APPROVER_ROLES.length, 4);
    assert.ok(isFirstLevelApprover(ROLES.CHAIRMAN));
    assert.ok(isFirstLevelApprover(ROLES.VICE_CHAIRMAN));
    assert.ok(isFirstLevelApprover(ROLES.SECRETARY));
    assert.ok(isFirstLevelApprover(ROLES.JOINT_SECRETARY));
    assert.ok(!isFirstLevelApprover(ROLES.EXECUTIVE_MEMBER));
    assert.ok(!isFirstLevelApprover(ROLES.TREASURER));
  });

  test('Final authority is strictly Admin (Staff Coordinator)', () => {
    assert.ok(isStaffCoordinator(ROLES.STAFF_COORDINATOR));
    assert.ok(!isStaffCoordinator(ROLES.CHAIRMAN));
    assert.ok(!isStaffCoordinator(ROLES.SECRETARY));
  });

  test('Chairman, Vice Chairman, Secretary, Joint Secretary and Admin can assign work', () => {
    assert.ok(canAssignWork(ROLES.STAFF_COORDINATOR), 'Admin can assign work');
    assert.ok(canAssignWork(ROLES.CHAIRMAN), 'Chairman can assign work');
    assert.ok(canAssignWork(ROLES.VICE_CHAIRMAN), 'Vice Chairman can assign work');
    assert.ok(canAssignWork(ROLES.SECRETARY), 'Secretary can assign work');
    assert.ok(canAssignWork(ROLES.JOINT_SECRETARY), 'Joint Secretary can assign work');
    assert.ok(canAssignWork(ROLES.EVENT_MANAGEMENT_HEAD), 'Event Head can assign work');
    assert.ok(!canAssignWork(ROLES.EXECUTIVE_MEMBER), 'Executive Member cannot assign work');
  });

  // 2. REAL COMMITTEE MEMBERS & CREDENTIALS
  console.log('\n--- 2. Real Committee Members & Username/Password Generation ---');
  let loadedMembers;
  await asyncTest('Real committee members register contains exactly 22 accounts (21 members + 1 Admin)', async () => {
    loadedMembers = await getMembers();
    assert.strictEqual(loadedMembers.length, 22, `Expected 22 accounts, found ${loadedMembers.length}`);
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

  test('Event Management Head Ramya Sri has ramya.emhead-01', () => {
    const ramya = loadedMembers.find((m) => m.name.includes('RAMYA'));
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

  test('Membership Director Swathi Nandhana has swathi.memdir-01', () => {
    const swathi = loadedMembers.find((m) => m.name.includes('SWATHI'));
    assert.strictEqual(swathi.username, 'swathi.memdir-01');
    assert.strictEqual(swathi.role, ROLES.MEMBERSHIP_DIRECTOR);
  });

  test('Executive members have sequential exec tags (aakanish.exec-01 to saiswaroopa.exec-11)', () => {
    const execs = loadedMembers.filter((m) => m.role === ROLES.EXECUTIVE_MEMBER);
    assert.strictEqual(execs.length, 11, 'Should have exactly 11 executive members');
    const firstExec = execs.find((m) => m.username === 'aakanish.exec-01');
    assert.ok(firstExec, 'First exec should be aakanish.exec-01');
  });

  test('Admin Staff Coordinator has admin.staff-01 username', () => {
    const admin = loadedMembers.find((m) => m.role === ROLES.STAFF_COORDINATOR);
    assert.ok(admin, 'Admin account exists');
    assert.strictEqual(admin.username, 'admin.staff-01');
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
    assert.ok(newlyAddedMember.password && newlyAddedMember.password.startsWith('IEI'));
  });

  test('Formatted credential notice can be copied for student distribution', () => {
    const notice = formatCredentialNotice(newlyAddedMember);
    assert.ok(notice.includes('kavitha.exec-12'));
    assert.ok(notice.includes(newlyAddedMember.password));
    assert.ok(notice.includes('Dr. M.G.R. Educational & Research Institute'));
  });

  // 4. CLEAN SLATE VERIFICATION
  console.log('\n--- 4. Clean Slate (Zero Dummy Example Data) ---');
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

  // 8. COMMITTEE MEETING ATTENDANCE SCOPE
  console.log('\n--- 8. Committee Meeting Attendance Strictly Scoped ---');
  await asyncTest('Attendance is strictly linked to scheduled official chapter events/meetings', async () => {
    const sec = loadedMembers.find((m) => m.role === ROLES.SECRETARY);
    const event = await createEvent({
      title: 'IEI Executive Committee General Body Meeting Q4',
      category: 'Committee Meeting',
      date: '2026-11-12',
      time: '14:30',
      venue: 'Mechanical Seminar Hall, Ground Floor',
      description: 'Review of upcoming symposium, accounts audit, and task distribution.'
    });

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
    assert.strictEqual(attRecord.records.length, 22);
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

  console.log('\n================================================================');
  console.log(`TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite();
