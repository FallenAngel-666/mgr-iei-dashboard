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

export function isMasterAdmin(role) {
  return role === ROLES.ADMINISTRATOR;
}

export function isFirstLevelApprover(role) {
  return FIRST_LEVEL_APPROVER_ROLES.includes(role) || isMasterAdmin(role);
}

export function isStaffCoordinator(role) {
  return (
    role === ROLES.STAFF_COORDINATOR ||
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

/**
 * Confidential Membership Directory Access:
 * STRICT RULE: Only Sri Priyan (Joint Secretary), Swathi Nandhana (Membership Director),
 * Ramya Sri (Event Management Head), and the Master Administrator can view and access the Membership Directory.
 * Blocked for all other committee members and staff.
 */
export function canAccessMembersDirectory(user) {
  if (!user) return false;
  
  // Master Administrator always has full access
  if (isMasterAdmin(user.role) || (user.username || '').toLowerCase() === 'admin.master-01') {
    return true;
  }
  
  const username = (user.username || '').toLowerCase();
  const email = (user.email || '').toLowerCase();
  const name = (user.name || '').toUpperCase();
  const role = user.role;

  // 1. Sri Priyan S (Joint Secretary)
  const isSriPriyan = 
    username === 'sripriyan.jsec-01' || 
    email === 'sri.priyan.s.2607@gmail.com' || 
    (name.includes('SRIPRIYAN') && role === ROLES.JOINT_SECRETARY);

  // 2. Swathi Nandhana M (Membership Director)
  const isSwathiNandhana = 
    username === 'swathi.memdir-01' || 
    username === 'swathi.emhead-01' || 
    email === 'swathinandhana3@gmail.com' || 
    name.includes('SWATHI') ||
    role === ROLES.MEMBERSHIP_DIRECTOR;

  // 3. Ramya Sri M (Event Management Head)
  const isRamyaSri = 
    username === 'ramya.emhead-01' || 
    username === 'ramya.memdir-01' || 
    email === 'ramyoshiii017@gmail.com' || 
    (name.includes('RAMYA') && name.includes('SRI')) ||
    (role === ROLES.EVENT_MANAGEMENT_HEAD && name.includes('RAMYA'));

  return Boolean(isSriPriyan || isSwathiNandhana || isRamyaSri);
}

export function canManageMembers(userOrRole) {
  if (!userOrRole) return false;
  if (typeof userOrRole === 'string') {
    return isMasterAdmin(userOrRole);
  }
  return canAccessMembersDirectory(userOrRole);
}

/**
 * Event Scheduling & Updates Permissions:
 * Chairmen (Chairman, Vice Chairman) and Secretaries (Secretary, Joint Secretary),
 * Event Management Head, Staff Coordinator, and Master Administrator can all
 * schedule meetings and update events.
 */
export function canManageEvents(role) {
  return (
    isMasterAdmin(role) ||
    isStaffCoordinator(role) ||
    role === ROLES.CHAIRMAN ||
    role === ROLES.VICE_CHAIRMAN ||
    role === ROLES.SECRETARY ||
    role === ROLES.JOINT_SECRETARY ||
    role === ROLES.EVENT_MANAGEMENT_HEAD
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
    role === ROLES.CHAIRMAN ||
    role === ROLES.VICE_CHAIRMAN ||
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

/**
 * Exact Role Permissions for IEI Profile Update:
 * STRICT RULE: Only Secretary, Joint Secretary, Chairman, Vice Chairman (and Master Administrator)
 * are authorized to update the public welcome page profile and manage upcoming public events.
 * Strictly blocked for Executive Members, Membership Director, Event Management Head,
 * Treasurer, Joint Treasurer, and Staff Coordinator.
 */
export function canAccessProfileUpdate(role) {
  return (
    isMasterAdmin(role) ||
    role === ROLES.CHAIRMAN ||
    role === ROLES.VICE_CHAIRMAN ||
    role === ROLES.SECRETARY ||
    role === ROLES.JOINT_SECRETARY
  );
}

export function canOverrideAnything(role) {
  return isMasterAdmin(role);
}
