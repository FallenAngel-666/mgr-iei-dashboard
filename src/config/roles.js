export const ROLES = {
  CHAIRMAN: 'Chairman',
  VICE_CHAIRMAN: 'Vice Chairman',
  SECRETARY: 'Secretary',
  JOINT_SECRETARY: 'Joint Secretary',
  TREASURER: 'Treasurer',
  JOINT_TREASURER: 'Joint Treasurer',
  MEMBERSHIP_DIRECTOR: 'Membership Director',
  EVENT_MANAGEMENT_HEAD: 'Event Management Head',
  EXECUTIVE_MEMBER: 'Executive Member',
  STAFF_COORDINATOR: 'Admin (Staff Coordinator)'
};

export const ROLE_LIST = [
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

// First-level approvers: any ONE of these four can approve/reject member reports
export const FIRST_LEVEL_APPROVER_ROLES = [
  ROLES.CHAIRMAN,
  ROLES.VICE_CHAIRMAN,
  ROLES.SECRETARY,
  ROLES.JOINT_SECRETARY
];

// Final approver: only Admin (Staff Coordinator)
export const FINAL_APPROVER_ROLES = [
  ROLES.STAFF_COORDINATOR
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

export function isFirstLevelApprover(role) {
  return FIRST_LEVEL_APPROVER_ROLES.includes(role);
}

export function isStaffCoordinator(role) {
  return role === ROLES.STAFF_COORDINATOR;
}

export function canAssignWork(role) {
  return (
    role === ROLES.STAFF_COORDINATOR ||
    FIRST_LEVEL_APPROVER_ROLES.includes(role) ||
    role === ROLES.EVENT_MANAGEMENT_HEAD
  );
}

export function canManageMembers(role) {
  return role === ROLES.STAFF_COORDINATOR || role === ROLES.MEMBERSHIP_DIRECTOR || role === ROLES.SECRETARY;
}

export function canManageEvents(role) {
  return (
    role === ROLES.STAFF_COORDINATOR ||
    role === ROLES.EVENT_MANAGEMENT_HEAD ||
    role === ROLES.SECRETARY ||
    role === ROLES.CHAIRMAN
  );
}

export function canManageAnnouncements(role) {
  return (
    role === ROLES.STAFF_COORDINATOR ||
    FIRST_LEVEL_APPROVER_ROLES.includes(role)
  );
}

export function canRecordAttendance(role) {
  return (
    role === ROLES.STAFF_COORDINATOR ||
    role === ROLES.SECRETARY ||
    role === ROLES.JOINT_SECRETARY ||
    role === ROLES.EVENT_MANAGEMENT_HEAD
  );
}

export function canAccessManagementReports(role) {
  return (
    role === ROLES.STAFF_COORDINATOR ||
    FIRST_LEVEL_APPROVER_ROLES.includes(role) ||
    role === ROLES.TREASURER ||
    role === ROLES.MEMBERSHIP_DIRECTOR
  );
}
