import {
  db,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot
} from '../config/firebase.js';
import { recordActivity, AUDIT_ACTIONS, AUDIT_MODULES } from './auditService.js';

// Default institutional public profile configuration
export const DEFAULT_PUBLIC_PROFILE = {
  aboutIeiHeading: 'THE INSTITUTION OF ENGINEERS (INDIA)',
  aboutIeiContent: 'The Institution of Engineers (India) [IEI] is the largest multi-disciplinary professional body of engineers, established in 1920 and incorporated by Royal Charter in 1935. Serving the engineering fraternity for over a century with 125+ centres across India and overseas, it spearheads engineering education, professional ethics, global accreditation, and technological innovation.',
  aboutIeiLogo: '/assets/apk-logo.png',
  
  aboutChapterHeading: 'About MGR IEI Student Chapter',
  // Exactly three lines requirement
  aboutChapterLines: [
    'Empowering future engineers through multidisciplinary technical symposiums, research, and innovation.',
    'Fostering academic excellence, professional ethics, and hands-on technological leadership across departments.',
    'Operating under the national charter of The Institution of Engineers (India) at Dr. M.G.R. Educational and Research Institute.'
  ],
  aboutChapterContent: 'Empowering future engineers through multidisciplinary technical symposiums, research, and innovation.\nFostering academic excellence, professional ethics, and hands-on technological leadership across departments.\nOperating under the national charter of The Institution of Engineers (India) at Dr. M.G.R. Educational and Research Institute.',
  
  // 5-photo automatic carousel configuration (5 photos)
  carouselPhotos: [
    {
      id: 'photo-1',
      url: '/assets/website-logo.png',
      title: 'Dr. M.G.R. Educational and Research Institute',
      caption: 'Deemed to be University — NAAC A+ Accredited Campus'
    },
    {
      id: 'photo-2',
      url: '/assets/apk-logo.png',
      title: 'The Institution of Engineers (India)',
      caption: 'Established 1920 • Incorporated by Royal Charter 1935'
    },
    {
      id: 'photo-3',
      url: '/assets/website-logo.png',
      title: 'MGR IEI Student Chapter Directorate',
      caption: 'Multidisciplinary Engineering Symposiums & Technical Workshops'
    },
    {
      id: 'photo-4',
      url: '/assets/apk-logo.png',
      title: 'IEI Royal Charter Emblem',
      caption: 'Centenary Heritage in Advancing Engineering Sciences'
    },
    {
      id: 'photo-5',
      url: '/assets/website-logo.png',
      title: 'Technical Innovations & Projects',
      caption: 'Maduravoyal, Chennai-95, Tamilnadu'
    }
  ],

  // Google Form URL for Student Membership Card
  membershipFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSc-iei-student-membership/viewform',

  // Official contact persons: Sriman Narayana Moorthy & Geethalakshmi (Student Chairman Elect)
  contacts: [
    {
      id: 'contact-sriman',
      name: 'Sriman Narayana Moorthy',
      role: 'Student Chairman Elect',
      phone: '8015803274',
      displayPhone: '+91 80158 03274',
      email: 'srimannarayanamoorthysridhar@gmail.com',
      department: 'Engineering'
    },
    {
      id: 'contact-geetha',
      name: 'Geethalakshmi',
      role: 'Student Chairman Elect',
      phone: '9884633809',
      displayPhone: '+91 98846 33809',
      email: 'geethaashok3114@gmail.com',
      department: 'Engineering'
    }
  ],

  // Upcoming events published for public view (empty by default)
  upcomingEvents: []
};

const PROFILE_STORAGE_KEY = 'iei_public_profile_v4';
const EVENTS_STORAGE_KEY = 'iei_public_events_v4';

function getLocalData(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    
    // Auto-migrate contact person formatting if older v1 data was cached
    if (parsed && Array.isArray(parsed.contacts)) {
      parsed.contacts = parsed.contacts.map((c) => {
        if (c.phone === '8015803274' || (c.name && c.name.toLowerCase().includes('sriman'))) {
          return {
            ...c,
            name: 'Sriman Narayana Moorthy',
            role: 'Student Chairman Elect',
            phone: '8015803274',
            displayPhone: '+91 80158 03274',
            email: 'srimannarayanamoorthysridhar@gmail.com'
          };
        }
        if (c.phone === '9884633809' || (c.name && c.name.toLowerCase().includes('geetha'))) {
          return {
            ...c,
            name: 'Geethalakshmi',
            role: 'Student Chairman Elect',
            phone: '9884633809',
            displayPhone: '+91 98846 33809',
            email: 'geethaashok3114@gmail.com'
          };
        }
        return c;
      });
    }

    if (parsed && parsed.aboutChapterHeading && parsed.aboutChapterHeading.includes('MJR IAE')) {
      parsed.aboutChapterHeading = 'About MGR IEI Student Chapter';
    }

    return parsed;
  } catch (e) {
    return fallback;
  }
}

function setLocalData(key, data) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

let publicProfileStore = getLocalData(PROFILE_STORAGE_KEY, DEFAULT_PUBLIC_PROFILE);
let publicEventsStore = getLocalData(EVENTS_STORAGE_KEY, []);

const profileSubscribers = new Set();
const eventsSubscribers = new Set();

function notifyProfile() {
  setLocalData(PROFILE_STORAGE_KEY, publicProfileStore);
  profileSubscribers.forEach((cb) => {
    try { cb({ ...publicProfileStore }); } catch (e) { console.error(e); }
  });
}

function notifyEvents() {
  setLocalData(EVENTS_STORAGE_KEY, publicEventsStore);
  eventsSubscribers.forEach((cb) => {
    try { cb([...publicEventsStore]); } catch (e) { console.error(e); }
  });
}

// Background Cloud Sync with Firestore
if (db) {
  try {
    // 1. Sync public profile config doc
    const profileDocRef = doc(db, 'iei_public_profile', 'main_config');
    onSnapshot(profileDocRef, (snap) => {
      if (snap.exists()) {
        const cloudData = snap.data();
        publicProfileStore = { ...DEFAULT_PUBLIC_PROFILE, ...cloudData };
        // Ensure contacts have Sriman Narayana Moorthy and Geethalakshmi clean names
        if (Array.isArray(publicProfileStore.contacts)) {
          publicProfileStore.contacts = publicProfileStore.contacts.map((c) => {
            if (c.phone === '8015803274' || (c.name && c.name.toLowerCase().includes('sriman'))) {
              return {
                ...c,
                name: 'Sriman Narayana Moorthy',
                role: 'Student Chairman Elect',
                phone: '8015803274',
                displayPhone: '+91 80158 03274'
              };
            }
            if (c.phone === '9884633809' || (c.name && c.name.toLowerCase().includes('geetha'))) {
              return {
                ...c,
                name: 'Geethalakshmi',
                role: 'Student Chairman Elect',
                phone: '9884633809',
                displayPhone: '+91 98846 33809'
              };
            }
            return c;
          });
        }
        notifyProfile();
      }
    }, (err) => {
      console.warn('Firestore profile sync info (using cached profile):', err.message);
    });

    // 2. Sync public upcoming events collection
    const eventsColRef = collection(db, 'iei_public_events');
    onSnapshot(eventsColRef, (snap) => {
      if (snap && snap.docs) {
        publicEventsStore = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        notifyEvents();
      }
    }, (err) => {
      console.warn('Firestore events sync info (using cached events):', err.message);
    });
  } catch (err) {
    console.warn('Firestore public listener init (running offline):', err);
  }
}

export function subscribeToPublicProfile(callback) {
  profileSubscribers.add(callback);
  callback({ ...publicProfileStore });
  return () => profileSubscribers.delete(callback);
}

export function subscribeToPublicEvents(callback) {
  eventsSubscribers.add(callback);
  callback([...publicEventsStore]);
  return () => eventsSubscribers.delete(callback);
}

export async function getPublicProfileConfig() {
  return { ...publicProfileStore };
}

export async function savePublicProfileConfig(updates, author = null) {
  publicProfileStore = {
    ...publicProfileStore,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: author ? { name: author.name, role: author.role, username: author.username } : null
  };
  notifyProfile();

  // Record audit trail
  const isCarousel = Boolean(updates.carouselPhotos);
  recordActivity({
    actor: author,
    action: isCarousel ? AUDIT_ACTIONS.GALLERY_UPDATED : AUDIT_ACTIONS.PROFILE_UPDATED,
    module: isCarousel ? AUDIT_MODULES.GALLERY : AUDIT_MODULES.PROFILE,
    status: 'SUCCESS',
    details: isCarousel
      ? `Public photo gallery carousel updated with ${updates.carouselPhotos?.length || 5} institutional photographs.`
      : `Public chapter profile updated by ${author?.name || 'Authorized Officer'}.`,
    targetId: 'main_config',
    newValues: updates
  });

  // Sync to Firestore central database
  if (db) {
    try {
      const profileDocRef = doc(db, 'iei_public_profile', 'main_config');
      await setDoc(profileDocRef, publicProfileStore, { merge: true });
    } catch (err) {
      console.warn('Firestore public profile push error:', err);
      throw err;
    }
  }

  return { ...publicProfileStore };
}

export async function getPublicUpcomingEvents() {
  return [...publicEventsStore];
}

export async function savePublicUpcomingEvent(eventData, author = null) {
  const newEvent = {
    ...eventData,
    id: eventData.id || `pub-evt-${Date.now()}`,
    createdAt: eventData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedBy: author ? { name: author.name, role: author.role } : null
  };

  const idx = publicEventsStore.findIndex((e) => e.id === newEvent.id);
  if (idx >= 0) {
    publicEventsStore[idx] = newEvent;
  } else {
    publicEventsStore.unshift(newEvent);
  }
  notifyEvents();

  recordActivity({
    actor: author,
    action: AUDIT_ACTIONS.EVENT_CREATED,
    module: AUDIT_MODULES.EVENTS,
    status: 'SUCCESS',
    details: `Public upcoming event published: "${newEvent.title}" (${newEvent.category || 'Technical'}).`,
    targetId: newEvent.id,
    newValues: { title: newEvent.title, date: newEvent.date, venue: newEvent.venue }
  });

  if (db) {
    try {
      const eventDocRef = doc(db, 'iei_public_events', newEvent.id);
      await setDoc(eventDocRef, newEvent);
    } catch (err) {
      console.warn('Firestore public event push error:', err);
      throw err;
    }
  }

  return newEvent;
}

export async function deletePublicUpcomingEvent(eventId) {
  const target = publicEventsStore.find((e) => e.id === eventId);
  publicEventsStore = publicEventsStore.filter((e) => e.id !== eventId);
  notifyEvents();

  recordActivity({
    action: AUDIT_ACTIONS.EVENT_DELETED,
    module: AUDIT_MODULES.EVENTS,
    status: 'SUCCESS',
    details: `Public upcoming event "${target?.title || eventId}" removed from public homepage.`,
    targetId: eventId
  });

  if (db) {
    try {
      const eventDocRef = doc(db, 'iei_public_events', eventId);
      await deleteDoc(eventDocRef);
    } catch (err) {
      console.warn('Firestore public event delete error:', err);
      throw err;
    }
  }
}
