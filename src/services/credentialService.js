import { ROLES } from '../config/roles.js';

export function getRoleTitle(role) {
  return role || 'Committee Member';
}

/**
 * Generate official institutional username based on student identity and role
 * e.g., "sriman.chair-01", "aakanish.exec-01"
 */
export function generateInstitutionalUsername(name, role, existingMembers = []) {
  if (!name || !role) return '';

  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .split(/\s+/)[0]; // First name token

  const rolePrefixMap = {
    [ROLES.ADMINISTRATOR]: 'admin.master',
    [ROLES.STAFF_COORDINATOR]: 'staff.coord',
    [ROLES.CHAIRMAN]: 'chair',
    [ROLES.VICE_CHAIRMAN]: 'vchair',
    [ROLES.SECRETARY]: 'sec',
    [ROLES.JOINT_SECRETARY]: 'jsec',
    [ROLES.MEMBERSHIP_DIRECTOR]: 'memdir',
    [ROLES.EVENT_MANAGEMENT_HEAD]: 'emhead',
    [ROLES.TREASURER]: 'treas',
    [ROLES.JOINT_TREASURER]: 'jtreas',
    [ROLES.EXECUTIVE_MEMBER]: 'exec'
  };

  const tag = rolePrefixMap[role] || 'member';

  if (role === ROLES.ADMINISTRATOR) {
    return 'admin.master-01';
  }
  if (role === ROLES.STAFF_COORDINATOR) {
    return 'staff.login';
  }

  // Count existing with this tag to determine index
  const matching = existingMembers.filter((m) => 
    (m.username && m.username.includes(`.${tag}-`)) ||
    (m.role === role)
  );

  const nextIndex = String(matching.length + 1).padStart(2, '0');
  return `${cleanName}.${tag}-${nextIndex}`;
}

export const generateUsername = generateInstitutionalUsername;

/**
 * Generate a strong, policy-compliant institutional password:
 * Pattern: IEI#FirstName*XXXX (XXXX = 4 pseudo-random numbers)
 * e.g., "IEI#Kavitha*7492" or "IEI#Ramya*9164"
 */
export function generateStrongPassword(name) {
  const token = (name || 'Member')
    .replace(/[^a-zA-Z]/g, ' ')
    .trim()
    .split(/\s+/)[0];

  const capitalized = token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
  const rand4 = Math.floor(1000 + Math.random() * 9000);
  return `IEI#${capitalized}*${rand4}`;
}

/**
 * Format official credential copy notice for distribution
 */
export function formatCredentialNotice(member) {
  return `--------------------------------------------------
THE INSTITUTION OF ENGINEERS (INDIA)
Dr. M.G.R. Educational & Research Institute
IEI DASHBOARD SYSTEM — Login Credentials
--------------------------------------------------
Member Name : ${member.name}
Designation : ${member.role}
Username    : ${member.username}
Password    : ${member.password}
Email       : ${member.email}
Phone       : ${member.phone || 'N/A'}
Portal Link : https://mgr-iei-dashboard.web.app
--------------------------------------------------
Please save these credentials safely and do not share them.`;
}
