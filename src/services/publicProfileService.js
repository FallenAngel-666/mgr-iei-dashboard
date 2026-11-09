import {
  db,
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from '../config/firebase.js';

// Default institutional public profile configuration
export const DEFAULT_PUBLIC_PROFILE = {
  aboutIeiHeading: 'About IEI',
  aboutIeiContent: 'The Institution of Engineers (India) [IEI] is the largest multi-disciplinary professional body of engineers, established in 1920 and incorporated by Royal Charter in 1935. IEI has been serving the engineering fraternity for over a century with 125+ State and Local Centres across India and overseas, spearheading technological advancement, engineering ethics, and international accreditation.',
  aboutIeiLogo: './assets/apk-logo.png',
  
  aboutChapterHeading: 'About MGR IEI Student Chapter',
  aboutChapterContent: 'Dr. M.G.R. Educational and Research Institute (Deemed to be University) Student Chapter operates under the institutional charter of The Institution of Engineers (India). Our chapter provides a collaborative technical ecosystem for engineering students across multidisciplinary departments, organizing national symposiums, hackathons, skill-building workshops, and technical paper presentations.',
  
  // 5-photo automatic carousel configuration
  carouselPhotos: [
    {
      id: 'photo-1',
      url: './assets/website-logo.png',
      title: 'Dr. M.G.R. Educational and Research Institute',
      caption: 'Deemed to be University — University with Graded Autonomy Status'
    },
    {
      id: 'photo-2',
      url: './assets/apk-logo.png',
      title: 'The Institution of Engineers (India)',
      caption: 'Established 1920 • Incorporated by Royal Charter 1935'
    },
    {
      id: 'photo-3',
      url: './assets/website-logo.png',
      title: 'MGR IEI Student Chapter Directorate',
      caption: 'Empowering future engineering leaders through hands-on technical excellence'
    },
    {
      id: 'photo-4',
      url: './assets/apk-logo.png',
      title: 'IEI Royal Charter Emblem',
      caption: 'Centenary Heritage in Advancing Engineering Sciences'
    },
    {
      id: 'photo-5',
      url: './assets/website-logo.png',
      title: 'NAAC A+ Accredited Campus',
      caption: 'Periyar E.V.R. High Road, Maduravoyal, Chennai-95, Tamilnadu'
    }
  ],

  // Google Form URL for Student Membership Card
  membershipFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSc-iei-student-membership/viewform',

  // Official contact persons (verified phone numbers from project directory)
  contacts: [
    {
      id: 'contact-1',
      name: 'Geethalakshmi',
      role: 'Chairman',
      phone: '9884633809',
      displayPhone: '+91 98846 33809',
      email: 'geethaashok3114@gmail.com',
      department: 'Engineering'
    },
    {
      id: 'contact-2',
      name: 'S. Rieman Nayanamurthy',
      role: 'Chairman',
      phone: '8015803274',
      displayPhone: '+91 80158 03274',
      email: 'srimannarayanamoorthysridhar@gmail.com',
      department: 'Engineering'
    }
  ],

  // Upcoming events published for public view (empty by default)
  upcomingEvents: []
};

const PROFILE_STORAGE_KEY = 'iei_public_profile_v1';
const EVENTS_STORAGE_KEY = 'iei_public_events_v1';

function getLocalData(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
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
if (typeof window !== 'undefined') {
  try {
    // 1. Sync public profile config doc
    const profileDocRef = doc(db, 'iei_public_profile', 'main_config');
    onSnapshot(profileDocRef, (snap) => {
      if (snap.exists()) {
        publicProfileStore = { ...DEFAULT_PUBLIC_PROFILE, ...snap.data() };
        notifyProfile();
      }
    }, (err) => {
      console.warn('Firestore profile sync info:', err.message);
    });

    // 2. Sync public upcoming events collection
    const eventsColRef = collection(db, 'iei_public_events');
    onSnapshot(eventsColRef, (snap) => {
      if (!snap.empty) {
        const events = [];
        snap.forEach((d) => events.push({ id: d.id, ...d.data() }));
        publicEventsStore = events;
        notifyEvents();
      }
    }, (err) => {
      console.warn('Firestore events sync info:', err.message);
    });
  } catch (err) {
    console.warn('Firestore snapshot setup skipped:', err);
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

  // Async sync to Firestore
  try {
    const profileDocRef = doc(db, 'iei_public_profile', 'main_config');
    await setDoc(profileDocRef, publicProfileStore, { merge: true });
  } catch (err) {
    console.warn('Firestore public profile push error (cached offline):', err);
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

  try {
    const eventDocRef = doc(db, 'iei_public_events', newEvent.id);
    await setDoc(eventDocRef, newEvent);
  } catch (err) {
    console.warn('Firestore public event push error (cached offline):', err);
  }

  return newEvent;
}

export async function deletePublicUpcomingEvent(eventId) {
  publicEventsStore = publicEventsStore.filter((e) => e.id !== eventId);
  notifyEvents();

  try {
    const eventDocRef = doc(db, 'iei_public_events', eventId);
    const { deleteDoc } = await import('../config/firebase.js');
    await deleteDoc(eventDocRef);
  } catch (err) {
    console.warn('Firestore public event delete error (cached offline):', err);
  }
}
