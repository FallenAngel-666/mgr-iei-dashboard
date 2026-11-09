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

// Local storage backup keys for offline resilience & immediate responsiveness
// v5 prefix ensures Administrator (Master User) and Staff Login credentials load cleanly
const STORAGE_PREFIX = 'iei_mgr_v5_';

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

// Purge legacy v1, v2, v3, and v4 localStorage keys if present to ensure complete purity
if (typeof localStorage !== 'undefined') {
  try {
    ['members', 'tasks', 'updates', 'events', 'attendance', 'announcements', 'certificates', 'achievements', 'notifications'].forEach((k) => {
      localStorage.removeItem('iei_mgr_' + k);
      localStorage.removeItem('iei_mgr_v2_' + k);
      localStorage.removeItem('iei_mgr_v3_' + k);
      localStorage.removeItem('iei_mgr_v4_' + k);
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
async function syncToFirestore(colName, docId, data, isMerge = false) {
  try {
    if (typeof window !== 'undefined' && db && docId) {
      const docRef = doc(db, colName, String(docId));
      if (isMerge) {
        await setDoc(docRef, data, { merge: true });
      } else {
        await setDoc(docRef, data);
      }
    }
  } catch (err) {
    // Cloud sync failure does not break local operations; local storage is already safely committed
  }
}

async function syncDeleteFromFirestore(colName, docId) {
  try {
    if (typeof window !== 'undefined' && db && docId) {
      const docRef = doc(db, colName, String(docId));
      await deleteDoc(docRef);
    }
  } catch (err) {
    // Resilient
  }
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

// Initialize background cloud listeners when in browser environment
if (typeof window !== 'undefined') {
  try {
    const collectionsToSync = [
      { name: 'iei_tasks', channel: 'tasks', getStore: () => tasksStore, setStore: (s) => { tasksStore = s; } },
      { name: 'iei_updates', channel: 'updates', getStore: () => updatesStore, setStore: (s) => { updatesStore = s; } },
      { name: 'iei_events', channel: 'events', getStore: () => eventsStore, setStore: (s) => { eventsStore = s; } },
      { name: 'iei_attendance', channel: 'attendance', getStore: () => attendanceStore, setStore: (s) => { attendanceStore = s; } },
      { name: 'iei_announcements', channel: 'announcements', getStore: () => announcementsStore, setStore: (s) => { announcementsStore = s; } }
    ];

    collectionsToSync.forEach(({ name, channel, getStore, setStore }) => {
      onSnapshot(collection(db, name), (snapshot) => {
        if (!snapshot.empty) {
          const cloudItems = [];
          snapshot.forEach((d) => cloudItems.push({ id: d.id, ...d.data() }));
          if (cloudItems.length > 0) {
            const currentMap = new Map(getStore().map(item => [item.id, item]));
            cloudItems.forEach(item => currentMap.set(item.id, item));
            const merged = Array.from(currentMap.values());
            setStore(merged);
            setLocalData(channel, merged);
            if (subscribers[channel]) {
              subscribers[channel].forEach((cb) => cb(merged));
            }
          }
        }
      }, () => {
        // Fallback gracefully without throwing
      });
    });
  } catch (e) {
    // Graceful offline fallback
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
    syncToFirestore('iei_members', updated.id, updated, true);
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
    syncToFirestore('iei_members', newMember.id, newMember);
    return newMember;
  }
}

export async function deleteMember(id) {
  membersStore = membersStore.filter((m) => m.id !== id);
  notify('members', [...membersStore]);
  syncDeleteFromFirestore('iei_members', id);
}

// --- TASKS ---
export async function getTasks() {
  return [...tasksStore];
}

export async function createTask(taskData) {
  const newTask = {
    ...taskData,
    id: `task-${Date.now()}`,
    assignedDate: taskData.assignedDate || new Date().toISOString().split('T')[0],
    status: taskData.status || 'Assigned',
    progress: taskData.progress || 0,
    updates: [],
    submittedReport: null,
    createdAt: new Date().toISOString()
  };
  tasksStore.unshift(newTask);
  notify('tasks', [...tasksStore]);
  syncToFirestore('iei_tasks', newTask.id, newTask);

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
    syncToFirestore('iei_tasks', id, updates, true);
    return tasksStore[idx];
  }
  return null;
}

export async function deleteTask(id) {
  tasksStore = tasksStore.filter((t) => t.id !== id);
  notify('tasks', [...tasksStore]);
  syncDeleteFromFirestore('iei_tasks', id);
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
    syncToFirestore('iei_tasks', taskId, { updates: task.updates, status: task.status, updatedAt: task.updatedAt }, true);
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
  syncToFirestore('iei_updates', newUpdate.id, newUpdate);

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

export async function createEvent(eventData) {
  const newEvent = {
    ...eventData,
    id: `evt-${Date.now()}`,
    isUpcoming: new Date(eventData.date) >= new Date(new Date().toISOString().split('T')[0]),
    hasAttendanceRecord: false,
    createdAt: new Date().toISOString()
  };
  eventsStore.unshift(newEvent);
  notify('events', [...eventsStore]);
  syncToFirestore('iei_events', newEvent.id, newEvent);

  // Notify members of upcoming event
  await createNotification({
    recipientId: 'all',
    title: `Official Event Scheduled: ${newEvent.title}`,
    message: `${newEvent.category} scheduled on ${newEvent.date} at ${newEvent.venue}.`,
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
    syncToFirestore('iei_events', id, updates, true);
    return eventsStore[idx];
  }
  return null;
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
  syncToFirestore('iei_attendance', newAttendance.id, newAttendance);

  // Mark the corresponding event as having attendance record
  const evIdx = eventsStore.findIndex((e) => e.id === eventId);
  if (evIdx >= 0) {
    eventsStore[evIdx].hasAttendanceRecord = true;
    eventsStore[evIdx].attendanceId = newAttendance.id;
    notify('events', [...eventsStore]);
    syncToFirestore('iei_events', eventId, { hasAttendanceRecord: true, attendanceId: newAttendance.id }, true);
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
  syncToFirestore('iei_announcements', newAnn.id, newAnn);

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
  return newNotif;
}

export async function markNotificationAsRead(notifId) {
  const idx = notificationsStore.findIndex((n) => n.id === notifId);
  if (idx >= 0) {
    notificationsStore[idx].read = true;
    notify('notifications', [...notificationsStore]);
  }
}

export async function markAllNotificationsAsRead(userId, userRole) {
  notificationsStore = notificationsStore.map((n) => {
    if (n.recipientId === 'all' || n.recipientId === userId || n.recipientRole === userRole) {
      return { ...n, read: true };
    }
    return n;
  });
  notify('notifications', [...notificationsStore]);
}
