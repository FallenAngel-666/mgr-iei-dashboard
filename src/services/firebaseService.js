import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from '../config/firebase.js';

import {
  INITIAL_MEMBERS,
  INITIAL_TASKS,
  INITIAL_UPDATES,
  INITIAL_EVENTS,
  INITIAL_ATTENDANCE,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_CERTIFICATES,
  INITIAL_ACHIEVEMENTS,
  INITIAL_NOTIFICATIONS
} from '../config/seedData.js';

import { generateUsername, generateStrongPassword } from './credentialService.js';
import { getISOWeekDetails } from '../utils/dateUtils.js';
import { recordActivity, AUDIT_ACTIONS, AUDIT_MODULES } from './auditService.js';
import { getPublicProfileConfig, savePublicProfileConfig } from './publicProfileService.js';

// Local storage backup keys for offline resilience & immediate responsiveness
// v9 prefix ensures all sample test entries are purged cleanly across all clients
const STORAGE_PREFIX = 'iei_mgr_v9_';

function getLocalData(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setLocalData(key, data) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

// In-memory active stores initialized with persistent local storage or seed defaults
let membersStore = getLocalData('members', INITIAL_MEMBERS);
let tasksStore = getLocalData('tasks', INITIAL_TASKS);
let updatesStore = getLocalData('updates', INITIAL_UPDATES);
let eventsStore = getLocalData('events', INITIAL_EVENTS);
let attendanceStore = getLocalData('attendance', INITIAL_ATTENDANCE);
let announcementsStore = getLocalData('announcements', INITIAL_ANNOUNCEMENTS);
let certificatesStore = getLocalData('certificates', INITIAL_CERTIFICATES);
let achievementsStore = getLocalData('achievements', INITIAL_ACHIEVEMENTS);
let notificationsStore = getLocalData('notifications', INITIAL_NOTIFICATIONS);

// Purge legacy v1 through v8 localStorage keys if present to ensure complete purity
if (typeof localStorage !== 'undefined') {
  try {
    ['members', 'tasks', 'updates', 'events', 'attendance', 'announcements', 'certificates', 'achievements', 'notifications'].forEach((k) => {
      localStorage.removeItem('iei_mgr_' + k);
      for (let v = 2; v <= 8; v++) {
        localStorage.removeItem(`iei_mgr_v${v}_` + k);
      }
    });
  } catch (e) {
    // ignore
  }
}

// Listeners collection for real-time reactivity
const subscribers = {
  members: new Set(),
  tasks: new Set(),
  updates: new Set(),
  events: new Set(),
  attendance: new Set(),
  announcements: new Set(),
  certificates: new Set(),
  achievements: new Set(),
  notifications: new Set()
};

function notify(channel, data) {
  setLocalData(channel, data);
  if (subscribers[channel]) {
    subscribers[channel].forEach((cb) => cb(data));
  }
}

// Background Firestore synchronization helper (resilient dual-write)
export async function syncToFirestore(colName, docId, data, isMerge = false) {
  if (db && docId) {
    try {
      const docRef = doc(db, colName, String(docId));
      if (isMerge) {
        await setDoc(docRef, data, { merge: true });
      } else {
        await setDoc(docRef, data);
      }
      return data;
    } catch (err) {
      console.warn(`Firestore sync error on ${colName}/${docId}:`, err.message);
      throw err;
    }
  }
  return data;
}

export async function syncDeleteFromFirestore(colName, docId) {
  if (db && docId) {
    try {
      const docRef = doc(db, colName, String(docId));
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.warn(`Firestore delete error on ${colName}/${docId}:`, err.message);
      throw err;
    }
  }
  return true;
}

// Subscribe helper
export function subscribeToData(channel, callback) {
  if (!subscribers[channel]) return () => {};
  subscribers[channel].add(callback);
  
  // Return current data immediately
  switch (channel) {
    case 'members': callback(membersStore); break;
    case 'tasks': callback(tasksStore); break;
    case 'updates': callback(updatesStore); break;
    case 'events': callback(eventsStore); break;
    case 'attendance': callback(attendanceStore); break;
    case 'announcements': callback(announcementsStore); break;
    case 'certificates': callback(certificatesStore); break;
    case 'achievements': callback(achievementsStore); break;
    case 'notifications': callback(notificationsStore); break;
  }

  return () => subscribers[channel].delete(callback);
}

// Initialize background cloud listeners for complete real-time synchronization
if (db) {
  try {
    const collectionsToSync = [
      { name: 'iei_members', channel: 'members', getStore: () => membersStore, setStore: (s) => { membersStore = s; } },
      { name: 'iei_tasks', channel: 'tasks', getStore: () => tasksStore, setStore: (s) => { tasksStore = s; } },
      { name: 'iei_updates', channel: 'updates', getStore: () => updatesStore, setStore: (s) => { updatesStore = s; } },
      { name: 'iei_events', channel: 'events', getStore: () => eventsStore, setStore: (s) => { eventsStore = s; } },
      { name: 'iei_attendance', channel: 'attendance', getStore: () => attendanceStore, setStore: (s) => { attendanceStore = s; } },
      { name: 'iei_announcements', channel: 'announcements', getStore: () => announcementsStore, setStore: (s) => { announcementsStore = s; } },
      { name: 'iei_certificates', channel: 'certificates', getStore: () => certificatesStore, setStore: (s) => { certificatesStore = s; } },
      { name: 'iei_achievements', channel: 'achievements', getStore: () => achievementsStore, setStore: (s) => { achievementsStore = s; } },
      { name: 'iei_notifications', channel: 'notifications', getStore: () => notificationsStore, setStore: (s) => { notificationsStore = s; } }
    ];

    collectionsToSync.forEach(({ name, channel, getStore, setStore }) => {
      onSnapshot(collection(db, name), (snapshot) => {
        const cloudItems = [];
        if (snapshot && snapshot.docs) {
          snapshot.docs.forEach((d) => cloudItems.push({ id: d.id, ...d.data() }));
        }

        // For members: merge cloud records with initial committee list
        if (channel === 'members') {
          const map = new Map(INITIAL_MEMBERS.map((m) => [m.id, m]));
          cloudItems.forEach((item) => {
            if (item && item.id && !item.name?.toLowerCase().includes('kavitha') && item.username !== 'kavitha.exec-12') {
              map.set(item.id, item);
            }
          });
          const merged = Array.from(map.values());
          setStore(merged);
          setLocalData(channel, merged);
          if (subscribers[channel]) {
            subscribers[channel].forEach((cb) => {
              try { cb(merged); } catch (e) { console.error(e); }
            });
          }
        } else {
          // Cloud Firestore is authoritative source of truth:
          // Deletions in Firestore automatically remove items from local memory
          const sorted = cloudItems.sort((a, b) => {
            const timeA = new Date(a.createdAt || a.timestamp || a.date || a.publishedAt || 0).getTime();
            const timeB = new Date(b.createdAt || b.timestamp || b.date || b.publishedAt || 0).getTime();
            return timeB - timeA;
          });
          setStore(sorted);
          setLocalData(channel, sorted);
          if (subscribers[channel]) {
            subscribers[channel].forEach((cb) => {
              try { cb(sorted); } catch (e) { console.error(e); }
            });
          }
        }
      }, (err) => {
        console.warn(`Firestore real-time listener info on ${name}:`, err.message);
      });
    });
  } catch (e) {
    console.warn('Firestore cloud listener init:', e);
  }
}

// Reset store back to clean slate if requested
export function resetToCleanSlate() {
  membersStore = [...INITIAL_MEMBERS];
  tasksStore = [];
  updatesStore = [];
  eventsStore = [];
  attendanceStore = [];
  announcementsStore = [];
  certificatesStore = [];
  achievementsStore = [];
  notificationsStore = [];

  ['members', 'tasks', 'updates', 'events', 'attendance', 'announcements', 'certificates', 'achievements', 'notifications'].forEach((k) => {
    setLocalData(k, k === 'members' ? membersStore : []);
    if (subscribers[k]) {
      subscribers[k].forEach((cb) => cb(k === 'members' ? membersStore : []));
    }
  });
}

// --- MEMBERS ---
export async function getMembers() {
  return [...membersStore];
}

export async function saveMember(member) {
  const existingIdx = membersStore.findIndex((m) => m.id === member.id);
  if (existingIdx >= 0) {
    const updated = {
      ...membersStore[existingIdx],
      ...member,
      updatedAt: new Date().toISOString()
    };
    membersStore[existingIdx] = updated;
    notify('members', [...membersStore]);
    await syncToFirestore('iei_members', updated.id, updated, true);
    await syncToFirestore('iei_users', updated.id, updated, true);

    recordActivity({
      action: AUDIT_ACTIONS.MEMBER_ROLE_CHANGED,
      module: AUDIT_MODULES.MEMBERS,
      status: 'SUCCESS',
      details: `Member record updated for ${updated.name} (@${updated.username}). Role: ${updated.role}, Status: ${updated.status}.`,
      targetId: updated.id,
      newValues: { name: updated.name, role: updated.role, status: updated.status }
    });

    return updated;
  } else {
    // Generate username and strong password automatically if not supplied
    const username = member.username || generateUsername(member.name, member.role, membersStore);
    const password = member.password || generateStrongPassword(member.name);
    const newMember = {
      ...member,
      id: member.id || `user-${Date.now()}`,
      username,
      password,
      joinedDate: member.joinedDate || new Date().toISOString().split('T')[0],
      status: member.status || 'Active'
    };
    membersStore.unshift(newMember);
    notify('members', [...membersStore]);
    await syncToFirestore('iei_members', newMember.id, newMember);
    await syncToFirestore('iei_users', newMember.id, newMember);

    recordActivity({
      action: AUDIT_ACTIONS.MEMBER_CREATED,
      module: AUDIT_MODULES.MEMBERS,
      status: 'SUCCESS',
      details: `New committee member registered: ${newMember.name} (@${newMember.username}) with role ${newMember.role}.`,
      targetId: newMember.id,
      newValues: { name: newMember.name, role: newMember.role, username: newMember.username }
    });

    return newMember;
  }
}

/**
 * Update User Profile with Central Database Synchronization
 * Synchronizes personal profile changes to Firestore and reflects across all connected dashboards.
 * If Chairman Sriman Narayana Moorthy or Geethalakshmi updates their profile,
 * also synchronizes their phone and name to the public homepage contacts.
 */
export async function updateUserProfile(userId, profileUpdates, author = null) {
  const memberIdx = membersStore.findIndex((m) => m.id === userId);
  if (memberIdx < 0) {
    throw new Error(`User with ID ${userId} not found in committee directory.`);
  }

  const existing = membersStore[memberIdx];
  const updated = {
    ...existing,
    ...profileUpdates,
    updatedAt: new Date().toISOString()
  };

  // 1. Commit directly to Firestore central database
  await syncToFirestore('iei_members', userId, updated, true);
  await syncToFirestore('iei_users', userId, updated, true);

  // 2. Update local state and notify subscribers
  membersStore[memberIdx] = updated;
  notify('members', [...membersStore]);

  // 3. Synchronize public homepage contact details if user is a chapter chairperson
  const isSriman = (updated.name || '').includes('Sriman') || updated.phone === '8015803274';
  const isGeetha = (updated.name || '').includes('Geetha') || updated.phone === '9884633809';
  if (isSriman || isGeetha) {
    try {
      const publicConf = await getPublicProfileConfig();
      if (publicConf && Array.isArray(publicConf.contacts)) {
        const updatedContacts = publicConf.contacts.map((c) => {
          if (isSriman && (c.phone === '8015803274' || (c.name && c.name.includes('Sriman')))) {
            return {
              ...c,
              name: updated.name,
              phone: updated.phone || c.phone,
              displayPhone: updated.phone ? `+91 ${updated.phone}` : c.displayPhone,
              email: updated.email || c.email
            };
          }
          if (isGeetha && (c.phone === '9884633809' || (c.name && c.name.includes('Geetha')))) {
            return {
              ...c,
              name: updated.name,
              phone: updated.phone || c.phone,
              displayPhone: updated.phone ? `+91 ${updated.phone}` : c.displayPhone,
              email: updated.email || c.email
            };
          }
          return c;
        });
        await savePublicProfileConfig({ contacts: updatedContacts }, author || updated);
      }
    } catch (e) {
      console.warn('Public contact sync error:', e);
    }
  }

  // 4. Record in System Activity Console
  recordActivity({
    actor: author || updated,
    action: AUDIT_ACTIONS.MEMBER_ROLE_CHANGED,
    module: AUDIT_MODULES.MEMBERS,
    status: 'SUCCESS',
    details: `Profile updated for ${updated.name} (${updated.role}). Fields: ${Object.keys(profileUpdates).join(', ')}.`,
    targetId: userId,
    previousValues: existing,
    newValues: profileUpdates
  });

  return updated;
}

export async function deleteMember(id) {
  const target = membersStore.find((m) => m.id === id);
  membersStore = membersStore.filter((m) => m.id !== id);
  notify('members', [...membersStore]);
  await syncDeleteFromFirestore('iei_members', id);
  await syncDeleteFromFirestore('iei_users', id);

  recordActivity({
    action: AUDIT_ACTIONS.MEMBER_STATUS_CHANGED,
    module: AUDIT_MODULES.MEMBERS,
    status: 'SUCCESS',
    details: `Member ${target?.name || id} removed from active register.`,
    targetId: id
  });
}

// --- TASKS ---
export async function getTasks() {
  return [...tasksStore];
}

export async function createTask(taskData) {
  const currentWeek = getISOWeekDetails();
  const newTask = {
    ...taskData,
    id: `task-${Date.now()}`,
    assignedDate: taskData.assignedDate || new Date().toISOString().split('T')[0],
    weeklyTag: taskData.weeklyTag || currentWeek.tag,
    status: taskData.status || 'Assigned',
    progress: taskData.progress || 0,
    updates: [],
    submittedReport: null,
    createdAt: new Date().toISOString()
  };
  tasksStore.unshift(newTask);
  notify('tasks', [...tasksStore]);
  await syncToFirestore('iei_tasks', newTask.id, newTask);

  // Record audit trail
  recordActivity({
    actor: { name: newTask.assignedByName, role: newTask.assignedByRole, id: newTask.assignedById },
    action: AUDIT_ACTIONS.WORK_TASK_ASSIGNED,
    module: AUDIT_MODULES.WORK,
    status: 'SUCCESS',
    details: `Task "${newTask.title}" assigned to ${newTask.assignedToName} (${newTask.assignedToRole}). Due: ${newTask.dueDate || 'N/A'}.`,
    targetId: newTask.id,
    newValues: { title: newTask.title, assignedTo: newTask.assignedToName, weeklyTag: newTask.weeklyTag }
  });

  // Create notification for assigned member
  await createNotification({
    recipientId: newTask.assignedToId,
    title: 'New Work Assignment',
    message: `You have been assigned: "${newTask.title}" by ${newTask.assignedByName} (${newTask.assignedByRole}). Due date: ${newTask.dueDate || 'N/A'}.`,
    type: 'assignment',
    linkId: newTask.id
  });

  return newTask;
}

export async function updateTask(id, updates) {
  const idx = tasksStore.findIndex((t) => t.id === id);
  if (idx >= 0) {
    tasksStore[idx] = { ...tasksStore[idx], ...updates, updatedAt: new Date().toISOString() };
    notify('tasks', [...tasksStore]);
    await syncToFirestore('iei_tasks', id, updates, true);
    return tasksStore[idx];
  }
  return null;
}

export async function deleteTask(id) {
  const target = tasksStore.find((t) => t.id === id);
  tasksStore = tasksStore.filter((t) => t.id !== id);
  notify('tasks', [...tasksStore]);
  await syncDeleteFromFirestore('iei_tasks', id);

  recordActivity({
    action: AUDIT_ACTIONS.WORK_TASK_DELETED,
    module: AUDIT_MODULES.WORK,
    status: 'SUCCESS',
    details: `Task "${target?.title || id}" removed from register.`,
    targetId: id
  });
}

export async function addTaskProgressUpdate(taskId, updateMessage, author) {
  const idx = tasksStore.findIndex((t) => t.id === taskId);
  if (idx >= 0) {
    const task = tasksStore[idx];
    const newUpdate = {
      id: `up-${Date.now()}`,
      authorName: author.name,
      authorRole: author.role,
      date: new Date().toISOString(),
      message: updateMessage
    };
    task.updates = [newUpdate, ...(task.updates || [])];
    task.status = 'In Progress';
    task.updatedAt = new Date().toISOString();
    notify('tasks', [...tasksStore]);
    await syncToFirestore('iei_tasks', taskId, { updates: task.updates, status: task.status, updatedAt: task.updatedAt }, true);
    return task;
  }
}

// --- COMMUNITY WORK UPDATES ---
export async function getUpdates() {
  return [...updatesStore];
}

export async function createCommunityUpdate({ author, content, imageUrl, attachmentName }) {
  const newUpdate = {
    id: `upd-${Date.now()}`,
    authorId: author.id,
    authorName: author.name,
    authorRole: author.role,
    timestamp: new Date().toISOString(),
    content,
    imageUrl: imageUrl || null,
    attachmentName: attachmentName || null,
    reactions: { like: 0, celebrate: 0 }
  };
  updatesStore.unshift(newUpdate);
  notify('updates', [...updatesStore]);
  await syncToFirestore('iei_updates', newUpdate.id, newUpdate);

  // Record audit trail
  recordActivity({
    actor: author,
    action: AUDIT_ACTIONS.CHAT_MESSAGE_SENT,
    module: AUDIT_MODULES.CHAT,
    status: 'SUCCESS',
    details: `Community work update posted by ${author.name}: "${content.substring(0, 80)}"`,
    targetId: newUpdate.id,
    newValues: { content: content.substring(0, 100), attachmentName }
  });

  // Notify chapter members
  await createNotification({
    recipientId: 'all',
    title: 'New Community Work Update',
    message: `${author.name} (${author.role}) posted a work update: "${content.substring(0, 75)}..."`,
    type: 'community_update',
    linkId: newUpdate.id
  });

  return newUpdate;
}

export async function toggleUpdateReaction(updateId, reactionType = 'like') {
  const idx = updatesStore.findIndex((u) => u.id === updateId);
  if (idx >= 0) {
    const current = updatesStore[idx].reactions || { like: 0, celebrate: 0 };
    current[reactionType] = (current[reactionType] || 0) + 1;
    updatesStore[idx].reactions = current;
    notify('updates', [...updatesStore]);
    syncToFirestore('iei_updates', updateId, { reactions: current }, true);
  }
}

// --- EVENTS ---
export async function getEvents() {
  return [...eventsStore];
}

export async function createEvent(eventData, author = null) {
  const eventAuthor = author || eventData.author || {
    name: eventData.scheduledByName || 'Chapter Directorate',
    role: eventData.scheduledByRole || 'Joint Secretary'
  };

  const newEvent = {
    ...eventData,
    id: `evt-${Date.now()}`,
    isUpcoming: new Date(eventData.date) >= new Date(new Date().toISOString().split('T')[0]),
    hasAttendanceRecord: false,
    scheduledByName: eventAuthor.name,
    scheduledByRole: eventAuthor.role,
    createdAt: new Date().toISOString()
  };
  eventsStore.unshift(newEvent);
  notify('events', [...eventsStore]);
  await syncToFirestore('iei_events', newEvent.id, newEvent);

  // Record audit trail
  recordActivity({
    actor: eventAuthor,
    action: AUDIT_ACTIONS.EVENT_CREATED,
    module: AUDIT_MODULES.EVENTS,
    status: 'SUCCESS',
    details: `Official meeting scheduled: "${newEvent.title}" on ${newEvent.date} at ${newEvent.time} in ${newEvent.venue}.`,
    targetId: newEvent.id,
    newValues: { title: newEvent.title, date: newEvent.date, time: newEvent.time, venue: newEvent.venue }
  });

  // 1. Auto-broadcast into Community Updates Stream (Chat Box)
  if (eventData.broadcastToChat !== false) {
    const chatContent = `📅 OFFICIAL MEETING SCHEDULED: "${newEvent.title}"\n🗓️ Date: ${newEvent.date} | ⏰ Clock Time: ${newEvent.time}\n📍 Venue: ${newEvent.venue}\n📋 Agenda: ${newEvent.description || 'Statutory review and committee proceedings'}\nScheduled by: ${eventAuthor.name} (${eventAuthor.role}). All designated members are requested to attend promptly.`;

    await createCommunityUpdate({
      author: eventAuthor,
      content: chatContent,
      attachmentName: 'Official_Meeting_Notice.pdf'
    });
  }

  // 2. Auto-broadcast into Circular Announcement Register
  if (eventData.broadcastToCircular !== false) {
    await createAnnouncement({
      title: `Official Meeting Notice: ${newEvent.title}`,
      priority: 'High',
      content: `Notice is hereby issued for ${newEvent.title} (${newEvent.category}) scheduled on ${newEvent.date} at ${newEvent.time} in ${newEvent.venue}. Agenda: ${newEvent.description || 'Official committee business and task distribution'}. Attendance is mandatory for designated members.`,
      author: eventAuthor
    });
  }

  // 3. Notify members of upcoming event
  await createNotification({
    recipientId: 'all',
    title: `Official Meeting Scheduled: ${newEvent.title}`,
    message: `${newEvent.category} scheduled on ${newEvent.date} at ${newEvent.time} in ${newEvent.venue}.`,
    type: 'event',
    linkId: newEvent.id
  });

  return newEvent;
}

export async function updateEvent(id, updates) {
  const idx = eventsStore.findIndex((e) => e.id === id);
  if (idx >= 0) {
    eventsStore[idx] = { ...eventsStore[idx], ...updates };
    notify('events', [...eventsStore]);
    await syncToFirestore('iei_events', id, updates, true);

    recordActivity({
      action: AUDIT_ACTIONS.EVENT_UPDATED,
      module: AUDIT_MODULES.EVENTS,
      status: 'SUCCESS',
      details: `Official meeting/event ${id} details updated.`,
      targetId: id,
      newValues: updates
    });

    return eventsStore[idx];
  }
  return null;
}

export async function deleteEvent(id) {
  const target = eventsStore.find((e) => e.id === id);
  eventsStore = eventsStore.filter((e) => e.id !== id);
  notify('events', [...eventsStore]);
  await syncDeleteFromFirestore('iei_events', id);

  recordActivity({
    action: AUDIT_ACTIONS.EVENT_DELETED,
    module: AUDIT_MODULES.EVENTS,
    status: 'SUCCESS',
    details: `Official meeting/event "${target?.title || id}" deleted from register.`,
    targetId: id
  });
}

// --- ATTENDANCE (Strictly for Committee Meetings and Official Events only) ---
export async function getAttendance() {
  return [...attendanceStore];
}

export async function recordEventAttendance({ eventId, eventTitle, category, date, recordedBy, notes, documentUrl, records }) {
  const newAttendance = {
    id: `att-${Date.now()}`,
    eventId,
    eventTitle,
    category,
    date,
    recordedById: recordedBy.id,
    recordedByName: recordedBy.name,
    recordedByRole: recordedBy.role,
    notes: notes || '',
    documentUrl: documentUrl || null,
    records,
    createdAt: new Date().toISOString()
  };

  attendanceStore.unshift(newAttendance);
  notify('attendance', [...attendanceStore]);
  await syncToFirestore('iei_attendance', newAttendance.id, newAttendance);

  // Record audit trail
  recordActivity({
    actor: recordedBy,
    action: AUDIT_ACTIONS.EVENT_ATTENDANCE_RECORDED,
    module: AUDIT_MODULES.EVENTS,
    status: 'SUCCESS',
    details: `Official meeting attendance recorded for "${eventTitle}" (${category}) on ${date}. Attendees: ${records?.length || 0}.`,
    targetId: newAttendance.id,
    newValues: { eventId, date, attendeesCount: records?.length || 0 }
  });

  // Mark the corresponding event as having attendance record
  const evIdx = eventsStore.findIndex((e) => e.id === eventId);
  if (evIdx >= 0) {
    eventsStore[evIdx].hasAttendanceRecord = true;
    eventsStore[evIdx].attendanceId = newAttendance.id;
    notify('events', [...eventsStore]);
    await syncToFirestore('iei_events', eventId, { hasAttendanceRecord: true, attendanceId: newAttendance.id }, true);
  }

  return newAttendance;
}

// --- ANNOUNCEMENTS ---
export async function getAnnouncements() {
  return [...announcementsStore];
}

export async function createAnnouncement({ title, priority, content, attachmentName, author }) {
  const newAnn = {
    id: `ann-${Date.now()}`,
    title,
    priority: priority || 'Normal',
    publishedAt: new Date().toISOString(),
    publishedByName: author.name,
    publishedByRole: author.role,
    content,
    attachmentName: attachmentName || null
  };
  announcementsStore.unshift(newAnn);
  notify('announcements', [...announcementsStore]);
  await syncToFirestore('iei_announcements', newAnn.id, newAnn);

  // Notify all members
  await createNotification({
    recipientId: 'all',
    title: `Announcement: ${title}`,
    message: `${author.name} published an official announcement: "${content.substring(0, 80)}..."`,
    type: 'announcement',
    linkId: newAnn.id
  });

  return newAnn;
}

export async function deleteAnnouncement(id) {
  const target = announcementsStore.find((a) => a.id === id);
  announcementsStore = announcementsStore.filter((a) => a.id !== id);
  notify('announcements', [...announcementsStore]);
  await syncDeleteFromFirestore('iei_announcements', id);

  recordActivity({
    action: AUDIT_ACTIONS.ANNOUNCEMENT_DELETED,
    module: AUDIT_MODULES.ANNOUNCEMENTS,
    status: 'SUCCESS',
    details: `Official circular/announcement "${target?.title || id}" removed.`,
    targetId: id
  });
}

// --- CERTIFICATES & ACHIEVEMENTS ---
export async function getCertificates() {
  return [...certificatesStore];
}

export async function createCertificate(certData) {
  const newCert = {
    ...certData,
    id: `cert-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  certificatesStore.unshift(newCert);
  notify('certificates', [...certificatesStore]);
  await syncToFirestore('iei_certificates', newCert.id, newCert);
  return newCert;
}

export async function getAchievements() {
  return [...achievementsStore];
}

export async function createAchievement(achData) {
  const newAch = {
    ...achData,
    id: `ach-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  achievementsStore.unshift(newAch);
  notify('achievements', [...achievementsStore]);
  await syncToFirestore('iei_achievements', newAch.id, newAch);
  return newAch;
}

// --- NOTIFICATIONS ---
export async function getNotifications(userId, userRole) {
  return notificationsStore.filter((n) => {
    if (n.recipientId === 'all') return true;
    if (n.recipientId === userId) return true;
    if (n.recipientRole && n.recipientRole === userRole) return true;
    return false;
  });
}

export async function createNotification(notifData) {
  const newNotif = {
    ...notifData,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    date: new Date().toISOString(),
    read: false
  };
  notificationsStore.unshift(newNotif);
  notify('notifications', [...notificationsStore]);
  await syncToFirestore('iei_notifications', newNotif.id, newNotif);
  return newNotif;
}

export async function markNotificationAsRead(notifId) {
  const idx = notificationsStore.findIndex((n) => n.id === notifId);
  if (idx >= 0) {
    notificationsStore[idx].read = true;
    notify('notifications', [...notificationsStore]);
    await syncToFirestore('iei_notifications', notifId, { read: true }, true);
  }
}

export async function markAllNotificationsAsRead(userId, userRole) {
  notificationsStore = notificationsStore.map((n) => {
    if (n.recipientId === 'all' || n.recipientId === userId || n.recipientRole === userRole) {
      if (!n.read) {
        syncToFirestore('iei_notifications', n.id, { read: true }, true).catch(() => {});
      }
      return { ...n, read: true };
    }
    return n;
  });
  notify('notifications', [...notificationsStore]);
}

export async function clearAllUserNotifications(userId, userRole) {
  const toDelete = notificationsStore.filter((n) => 
    n.recipientId === 'all' || n.recipientId === userId || n.recipientRole === userRole
  );
  notificationsStore = notificationsStore.filter((n) => 
    !(n.recipientId === 'all' || n.recipientId === userId || n.recipientRole === userRole)
  );
  notify('notifications', [...notificationsStore]);

  for (const n of toDelete) {
    syncDeleteFromFirestore('iei_notifications', n.id).catch(() => {});
  }
}

// Ensure initial institutional committee records are seeded to Cloud Firestore
export async function ensureCloudSeeded() {
  if (!db) return;
  try {
    const memSnap = await getDocs(collection(db, 'iei_members'));
    if (memSnap.empty) {
      console.log('Seeding initial committee directory to Cloud Firestore...');
      for (const m of INITIAL_MEMBERS) {
        await syncToFirestore('iei_members', m.id, m);
      }
    }
  } catch (err) {
    console.warn('Cloud seeding check notice:', err.message);
  }
}

// Automatically invoke cloud seeding check
ensureCloudSeeded().catch(() => {});
