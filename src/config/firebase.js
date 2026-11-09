import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
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
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});

// Firebase configuration using environment variables with institutional fallback
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyCddFLGz2TjRGmpg8cNcWrm-rtYmNNXvXE",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "sachin-crackers-smartpos-81c6a.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "sachin-crackers-smartpos-81c6a",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "sachin-crackers-smartpos-81c6a.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "143073801647",
  appId: env.VITE_FIREBASE_APP_ID || "1:143073801647:web:e75f4300893c55b39a6b5a",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-3R5NMW0K39"
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
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
  onSnapshot,
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL
};
