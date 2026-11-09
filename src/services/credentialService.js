import { ROLES } from '../config/roles.js';

export const ROLE_TAGS = {
  [ROLES.CHAIRMAN]: 'chair',
  [ROLES.VICE_CHAIRMAN]: 'vchair',
  [ROLES.SECRETARY]: 'sec',
  [ROLES.JOINT_SECRETARY]: 'jsec',
  [ROLES.TREASURER]: 'tres',
  [ROLES.JOINT_TREASURER]: 'jtres',
  [ROLES.MEMBERSHIP_DIRECTOR]: 'memdir',
  [ROLES.EVENT_MANAGEMENT_HEAD]: 'emhead',
  [ROLES.EXECUTIVE_MEMBER]: 'exec',
  [ROLES.STAFF_COORDINATOR]: 'staff'
};

/**
 * Generates an institutional username following the convention:
 * <firstname>.<role_tag>-<index_padded_2_digits>
 * e.g., "SRIMAN NARAYANA MOORTHY S" -> "sriman.chair-01"
 */
export function generateUsername(name = '', role = ROLES.EXECUTIVE_MEMBER, existingMembers = []) {
  const cleanParts = name
    .trim()
    .split(/\s+/)
    .map((p) => p.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);

  let firstName = 'member';
  if (cleanParts.length > 0) {
    // If the first token is a single-letter initial (e.g. "J L Hemanth"), find the first token with length > 1
    const longer = cleanParts.find((p) => p.length > 1);
    firstName = longer || cleanParts[0];
  }

  const tag = ROLE_TAGS[role] || 'member';

  // Count existing members who share this tag in their username or role
  const count = existingMembers.filter((m) => {
    if (m.username && m.username.includes(`.${tag}-`)) return true;
    return m.role === role;
  }).length;

  const nextIndex = String(count + 1).padStart(2, '0');
  return `${firstName}.${tag}-${nextIndex}`;
}

/**
 * Generates a strong, random, unambiguous password
 * e.g., "IEI#Kavitha*7492" or "IEI$Staff@8391"
 */
export function generateStrongPassword(name = '') {
  const symbols = ['*', '#', '$', '!', '@'];
  const sym1 = symbols[Math.floor(Math.random() * symbols.length)];
  const sym2 = symbols[Math.floor(Math.random() * symbols.length)];

  // Clean name part if provided
  let cleanName = 'Member';
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).map((p) => p.replace(/[^a-zA-Z]/g, '')).filter(Boolean);
    const longer = parts.find((p) => p.length > 2);
    if (longer) {
      cleanName = longer.charAt(0).toUpperCase() + longer.slice(1).toLowerCase();
    }
  }

  // 4 random digits
  const randomDigits = Math.floor(1000 + Math.random() * 9000);

  return `IEI${sym1}${cleanName}${sym2}${randomDigits}`;
}

/**
 * Formats a ready-to-share message for WhatsApp / Email
 */
export function formatCredentialNotice(member) {
  return `--------------------------------------------------
THE INSTITUTION OF ENGINEERS (INDIA)
Dr. M.G.R. Educational & Research Institute
IEI Student Chapter Portal Login Credentials
--------------------------------------------------
Member Name : ${member.name}
Designation : ${member.role}
Username    : ${member.username}
Password    : ${member.password}
Email       : ${member.email}
Phone       : ${member.phone || 'N/A'}
Portal Link : https://sachin-crackers-smartpos-81c6a.web.app
--------------------------------------------------
Please save these credentials safely and do not share them.`;
}
