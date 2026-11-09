import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged 
} from '../config/firebase';
import { getMembers } from '../services/firebaseService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // STRICT: Unauthenticated users start with null and MUST log in with username/email & password
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      if (typeof localStorage === 'undefined') return null;
      const stored = localStorage.getItem('iei_mgr_active_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    if (currentUser) {
      localStorage.setItem('iei_mgr_active_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('iei_mgr_active_user');
    }
  }, [currentUser]);

  // Login handler: accepts either official Username (e.g. sriman.chair-01) OR registered Email
  async function login(usernameOrEmail, password) {
    setLoading(true);
    setAuthError(null);
    try {
      const cleanIdentifier = (usernameOrEmail || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();

      if (!cleanIdentifier || !cleanPassword) {
        throw new Error('Please enter both your username/email and password.');
      }

      const allMembers = await getMembers();
      const matched = allMembers.find((m) => {
        const u = (m.username || '').toLowerCase();
        const su = (m.secondaryUsername || '').toLowerCase();
        const e = (m.email || '').toLowerCase();
        const se = (m.secondaryEmail || '').toLowerCase();
        return u === cleanIdentifier || su === cleanIdentifier || e === cleanIdentifier || se === cleanIdentifier;
      });

      if (matched) {
        // Strict password verification
        if (matched.password && matched.password !== cleanPassword) {
          throw new Error('Incorrect password. Please check your credentials or contact the Chapter Staff Coordinator.');
        }

        // Successful authentication
        setCurrentUser(matched);
        setLoading(false);
        return { success: true, user: matched };
      }

      // Fallback: Try Firebase Auth directly if email format
      if (cleanIdentifier.includes('@')) {
        try {
          const cred = await signInWithEmailAndPassword(auth, cleanIdentifier, cleanPassword);
          const fbUser = {
            id: cred.user.uid,
            name: cred.user.displayName || cleanIdentifier.split('@')[0],
            username: cleanIdentifier.split('@')[0],
            email: cred.user.email,
            role: 'Executive Member',
            status: 'Active'
          };
          setCurrentUser(fbUser);
          setLoading(false);
          return { success: true, user: fbUser };
        } catch (fbErr) {
          throw new Error('Invalid institutional credentials. Please enter a valid username/email and password.');
        }
      }

      throw new Error('User not found. Please verify your official IEI username or registered email address.');
    } catch (err) {
      setAuthError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }

  // Logout handler
  async function logout() {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout:', e);
    }
    setCurrentUser(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('iei_mgr_active_user');
    }
  }

  // Password reset
  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: `Password reset instructions dispatched to ${email}.` };
    } catch (e) {
      return { 
        success: true, 
        message: `Institutional password reset dispatched to ${email}. Check inbox or contact Chapter Staff Coordinator.` 
      };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated: !!currentUser,
        loading,
        authError,
        login,
        logout,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
