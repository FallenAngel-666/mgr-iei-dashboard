export const ROLES = {
  ADMINISTRATOR: 'Administrator', // Master User / Super Admin who can change anything
  STAFF_COORDINATOR: 'Staff Coordinator',
  CHAIRMAN: 'Chairman',
  VICE_CHAIRMAN: 'Vice Chairman',
  SECRETARY: 'Secretary',
  JOINT_SECRETARY: 'Joint Secretary',
  TREASURER: 'Treasurer',
  JOINT_TREASURER: 'Joint Treasurer',
  MEMBERSHIP_DIRECTOR: 'Membership Director',
  EVENT_MANAGEMENT_HEAD: 'Event Management Head',
  EXECUTIVE_MEMBER: 'Executive Member'
};

export const ROLE_LIST = [
  ROLES.ADMINISTRATOR,
  ROLES.STAFF_COORDINATOR,
  ROLES.CHAIRMAN,
  ROLES.VICE_CHAIRMAN,
  ROLES.SECRETARY,
  ROLES.JOINT_SECRETARY,
  ROLES.TREASURER,
  ROLES.JOINT_TREASURER,
  ROLES.MEMBERSHIP_DIRECTOR,
  ROLES.EVENT_MANAGEMENT_HEAD,
  ROLES.EXECUTIVE_MEMBER
];

// First-level approvers: any ONE of these can approve/reject member reports
export const FIRST_LEVEL_APPROVER_ROLES = [
  ROLES.ADMINISTRATOR,
  ROLES.CHAIRMAN,
  ROLES.VICE_CHAIRMAN,
  ROLES.SECRETARY,
  ROLES.JOINT_SECRETARY
];

// Final approvers: Administrator (Master User) and Staff Coordinator
export const FINAL_APPROVER_ROLES = [
  ROLES.ADMINISTRATOR,
  ROLES.STAFF_COORDINATOR,
  'Admin (Staff Coordinator)'
];

export const WORK_STATUSES = {
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  SUBMITTED: 'Submitted',
  PENDING_FIRST_LEVEL: 'Pending First-Level Approval',
  PENDING_FINAL: 'Pending Final Approval',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed'
};

export function isMasterAdmin(role) {
  return role === ROLES.ADMINISTRATOR;
}

export function isFirstLevelApprover(role) {
  return FIRST_LEVEL_APPROVER_ROLES.includes(role) || isMasterAdmin(role);
}

export function isStaffCoordinator(role) {
  return (
    role === ROLES.STAFF_COORDINATOR ||
    role === 'Admin (Staff Coordinator)' ||
    isMasterAdmin(role)
  );
}

export function canAssignWork(role) {
  return (
    isMasterAdmin(role) ||
    isStaffCoordinator(role) ||
    FIRST_LEVEL_APPROVER_ROLES.includes(role) ||
    role === ROLES.EVENT_MANAGEMENT_HEAD
  );
}

export function canManageMembers(role) {
  return (
    isMasterAdmin(role) ||
    isStaffCoordinator(role) ||
    role === ROLES.MEMBERSHIP_DIRECTOR ||
    role === ROLES.SECRETARY
  );
}

export function canManageEvents(role) {
  return (
    isMasterAdmin(role) ||
    isStaffCoordinator(role) ||
    role === ROLES.EVENT_MANAGEMENT_HEAD ||
    role === ROLES.SECRETARY ||
    role === ROLES.CHAIRMAN
  );
}

export function canManageAnnouncements(role) {
  return (
    isMasterAdmin(role) ||
    isStaffCoordinator(role) ||
    FIRST_LEVEL_APPROVER_ROLES.includes(role)
  );
}

export function canRecordAttendance(role) {
  return (
    isMasterAdmin(role) ||
    isStaffCoordinator(role) ||
    role === ROLES.SECRETARY ||
    role === ROLES.JOINT_SECRETARY ||
    role === ROLES.EVENT_MANAGEMENT_HEAD
  );
}

export function canAccessManagementReports(role) {
  return (
    isMasterAdmin(role) ||
    isStaffCoordinator(role) ||
    FIRST_LEVEL_APPROVER_ROLES.includes(role) ||
    role === ROLES.TREASURER ||
    role === ROLES.MEMBERSHIP_DIRECTOR
  );
}

export function canOverrideAnything(role) {
  return isMasterAdmin(role);
}
