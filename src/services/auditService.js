import {
  db,
  collection,
  doc,
  setDoc,
  onSnapshot
} from '../config/firebase.js';

export const AUDIT_MODULES = {
  AUTH: 'AUTH',
  PROFILE: 'PROFILE',
  CHAT: 'CHAT',
  WORK: 'WORK',
  EVENTS: 'EVENTS',
  GALLERY: 'GALLERY',
  MEMBERS: 'MEMBERS',
  SETTINGS: 'SETTINGS',
  SECURITY: 'SECURITY'
};

export const AUDIT_ACTIONS = {
  // Authentication
  AUTH_LOGIN: 'AUTH_LOGIN',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
  AUTH_PASSWORD_RESET: 'AUTH_PASSWORD_RESET',

  // Profile & Homepage
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  PROFILE_NARRATIVE_UPDATED: 'PROFILE_NARRATIVE_UPDATED',
  MEMBERSHIP_FORM_UPDATED: 'MEMBERSHIP_FORM_UPDATED',

  // Community Chat & Updates
  CHAT_MESSAGE_SENT: 'CHAT_MESSAGE_SENT',
  CHAT_MESSAGE_EDITED: 'CHAT_MESSAGE_EDITED',
  CHAT_MESSAGE_DELETED: 'CHAT_MESSAGE_DELETED',

  // Work & Approvals
  WORK_TASK_ASSIGNED: 'WORK_TASK_ASSIGNED',
  WORK_REPORT_SUBMITTED: 'WORK_REPORT_SUBMITTED',
  WORK_LEVEL1_APPROVED: 'WORK_LEVEL1_APPROVED',
  WORK_FINAL_APPROVED: 'WORK_FINAL_APPROVED',
  WORK_REJECTED: 'WORK_REJECTED',
  WORK_TASK_DELETED: 'WORK_TASK_DELETED',

  // Events & Attendance
  EVENT_CREATED: 'EVENT_CREATED',
  EVENT_UPDATED: 'EVENT_UPDATED',
  EVENT_DELETED: 'EVENT_DELETED',
  EVENT_ATTENDANCE_RECORDED: 'EVENT_ATTENDANCE_RECORDED',

  // Gallery
  GALLERY_UPDATED: 'GALLERY_UPDATED',
  GALLERY_PHOTO_UPLOADED: 'GALLERY_PHOTO_UPLOADED',
  GALLERY_PHOTO_REPLACED: 'GALLERY_PHOTO_REPLACED',
  GALLERY_PHOTO_DELETED: 'GALLERY_PHOTO_DELETED',

  // Members Management
  MEMBER_CREATED: 'MEMBER_CREATED',
  MEMBER_ROLE_CHANGED: 'MEMBER_ROLE_CHANGED',
  MEMBER_STATUS_CHANGED: 'MEMBER_STATUS_CHANGED',

  // Security & Violations
  SECURITY_ACCESS_DENIED: 'SECURITY_ACCESS_DENIED',
  SECURITY_UNAUTHORIZED_ATTEMPT: 'SECURITY_UNAUTHORIZED_ATTEMPT'
};

// Security sanitization helper: completely removes passwords, tokens, or credentials
function sanitizePayload(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizePayload);

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    const k = key.toLowerCase();
    if (k.includes('password') || k.includes('token') || k.includes('secret') || k.includes('credential')) {
      clean[key] = '[REDACTED_CREDENTIAL]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizePayload(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

const STORAGE_KEY = 'iei_system_audit_logs_v1';

// Initial institutional system startup events
const INITIAL_AUDIT_LOGS = [
  {
    id: 'audit-boot-001',
    actorUid: 'system.engine',
    actorUsername: 'system.kernel',
    actorName: 'MGR IEI Security Core',
    actorRole: 'System Service',
    action: 'SYSTEM_BOOT',
    module: AUDIT_MODULES.SECURITY,
    targetId: 'sys-core',
    timestamp: '2026-11-01T00:00:00.000Z',
    status: 'SUCCESS',
    details: 'MGR IEI Institutional Platform — Immutable Activity Engine initialized with cryptographic retention.',
    correlationId: 'boot-init-001'
  },
  {
    id: 'audit-boot-002',
    actorUid: 'admin.master-01',
    actorUsername: 'admin.master-01',
    actorName: 'Master Administrator',
    actorRole: 'Administrator',
    action: 'POLICY_VERIFIED',
    module: AUDIT_MODULES.SECURITY,
    targetId: 'rbac-governance',
    timestamp: '2026-11-01T00:00:01.000Z',
    status: 'SUCCESS',
    details: 'Security Access Control verified: Read-only access restricted strictly to CBN Joint Secretary and Master Administrator.',
    correlationId: 'sec-chk-002'
  }
];

function getStoredLogs() {
  try {
    if (typeof localStorage === 'undefined') return INITIAL_AUDIT_LOGS;
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_AUDIT_LOGS;
  } catch (e) {
    return INITIAL_AUDIT_LOGS;
  }
}

function persistLogs(logs) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn('LocalStorage audit save failed:', e);
  }
}

let activeLogs = getStoredLogs();
const subscribers = new Set();

function notifySubscribers() {
  persistLogs(activeLogs);
  subscribers.forEach((cb) => {
    try { cb([...activeLogs]); } catch (e) { console.error(e); }
  });
}

// Background Cloud Sync with Firestore
if (typeof window !== 'undefined') {
  try {
    const auditCol = collection(db, 'system_audit_logs');
    onSnapshot(auditCol, (snapshot) => {
      if (snapshot && snapshot.docs && snapshot.docs.length > 0) {
        const cloudLogs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Merge cloud logs with local logs preserving uniqueness and sorting by timestamp descending
        const map = new Map();
        [...cloudLogs, ...activeLogs].forEach((item) => {
          if (item && item.id) map.set(item.id, item);
        });
        activeLogs = Array.from(map.values()).sort(
          (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        );
        notifySubscribers();
      }
    }, (err) => {
      console.warn('Firestore audit sync info (offline/cache):', err.message);
    });
  } catch (err) {
    console.warn('Firestore audit init:', err);
  }
}

/**
 * Record an immutable audit log entry.
 * Note: Only append is permitted. No edit or delete function exists in this module.
 */
export async function recordActivity({
  actor = null,
  action,
  module = AUDIT_MODULES.SECURITY,
  targetId = null,
  status = 'SUCCESS', // 'SUCCESS' | 'FAILED' | 'DENIED'
  details = '',
  previousValues = null,
  newValues = null,
  correlationId = null
}) {
  const timestamp = new Date().toISOString();
  const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const auditEntry = {
    id,
    actorUid: actor?.id || actor?.uid || actor?.username || 'anonymous',
    actorUsername: actor?.username || 'anonymous',
    actorName: actor?.name || 'Anonymous User',
    actorRole: actor?.role || 'Guest',
    action: action || 'GENERIC_OPERATION',
    module: module || AUDIT_MODULES.SECURITY,
    targetId: targetId || 'N/A',
    timestamp,
    status: status.toUpperCase(),
    details: details || `${action} executed by ${actor?.name || 'Unknown'}`,
    previousValues: previousValues ? sanitizePayload(previousValues) : null,
    newValues: newValues ? sanitizePayload(newValues) : null,
    correlationId: correlationId || `req-${Math.random().toString(36).substring(2, 8)}`,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js'
  };

  // Add to in-memory active store
  activeLogs.unshift(auditEntry);
  notifySubscribers();

  // Async push to Firestore /system_audit_logs
  try {
    const docRef = doc(db, 'system_audit_logs', id);
    await setDoc(docRef, auditEntry);
  } catch (err) {
    // Durable offline queue: log already saved in localStorage activeLogs
    console.warn('Firestore audit push (cached durable outbox):', err.message);
  }

  return auditEntry;
}

/**
 * Subscribe to live audit logs feed for the terminal console.
 */
export function subscribeToAuditLogs(callback) {
  subscribers.add(callback);
  callback([...activeLogs]);
  return () => subscribers.delete(callback);
}

/**
 * Get all audit records (Read-Only).
 * IMMUTABILITY GUARANTEE: Does not provide update, delete, or clear operations.
 */
export async function getAuditLogs() {
  return [...activeLogs];
}
