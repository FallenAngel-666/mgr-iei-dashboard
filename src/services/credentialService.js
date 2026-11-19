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
 * Institutional Password Policy Validation:
 * - Minimum 12 characters
 * - Uppercase letters (A-Z)
 * - Lowercase letters (a-z)
 * - Numbers (0-9)
 * - Special characters (!@#$%^&*...)
 * - Rejects commonly compromised or predictable passwords
 */
export const COMMONLY_COMPROMISED_PASSWORDS = [
  'password', 'password123', 'admin123456', 'qwerty123456',
  'iei123456789', 'drmgrdu12345', 'changeme1234', 'welcome12345',
  '123456789012', 'administrator'
];

export function validatePasswordPolicy(password = '') {
  const p = String(password || '');
  const errors = [];

  if (p.length < 12) {
    errors.push('Minimum 12 characters required');
  }
  if (!/[A-Z]/.test(p)) {
    errors.push('At least one uppercase letter (A-Z) required');
  }
  if (!/[a-z]/.test(p)) {
    errors.push('At least one lowercase letter (a-z) required');
  }
  if (!/[0-9]/.test(p)) {
    errors.push('At least one number (0-9) required');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p)) {
    errors.push('At least one special character (!@#$%^&*...) required');
  }

  const lower = p.toLowerCase();
  const isCompromised = COMMONLY_COMPROMISED_PASSWORDS.some(common => lower.includes(common));
  if (isCompromised) {
    errors.push('Password contains a predictable or commonly compromised sequence');
  }

  // Calculate score (0 to 5)
  let score = 0;
  if (p.length >= 12) score += 1;
  if (p.length >= 14) score += 1;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 1;
  if (/[0-9]/.test(p)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p)) score += 1;
  if (isCompromised) score = Math.max(0, score - 2);

  let strength = 'Weak';
  if (score >= 5) strength = 'Excellent';
  else if (score >= 4) strength = 'Strong';
  else if (score >= 3) strength = 'Good';
  else if (score >= 2) strength = 'Fair';

  return {
    isValid: errors.length === 0,
    score,
    strength,
    errors
  };
}

export function isPasswordWeak(password = '') {
  return !validatePasswordPolicy(password).isValid;
}

/**
 * Generate a strong, policy-compliant institutional password:
 * Pattern: IEI#FirstName*2026!XXXX (>= 16 characters)
 * Meets all 5 criteria: uppercase, lowercase, numbers, special characters, length >= 12.
 */
export function generateStrongPassword(name) {
  const token = (name || 'Member')
    .replace(/[^a-zA-Z]/g, ' ')
    .trim()
    .split(/\s+/)[0];

  const capitalized = token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
  const rand4 = Math.floor(1000 + Math.random() * 9000);
  return `IEI#${capitalized}*2026!${rand4}`;
}

/**
 * Resolve production portal URL dynamically without hardcoding a specific host.
 * Priority: VITE_APP_URL env var -> current browser origin -> fallback placeholder.
 */
export function getPortalBaseUrl() {
  const envUrl =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL
      ? String(import.meta.env.VITE_APP_URL).trim().replace(/\/+$/, '')
      : '';
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://your-iei-portal-domain.com';
}

/**
 * Format official credential copy notice for distribution
 */
export function formatCredentialNotice(member) {
  const portalUrl = getPortalBaseUrl();
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
Portal Link : ${portalUrl}
--------------------------------------------------
Please save these credentials safely and do not share them.`;
}
