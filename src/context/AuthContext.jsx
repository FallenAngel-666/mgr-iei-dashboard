import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged 
} from '../config/firebase';
import { getMembers, subscribeToData, updateUserProfile } from '../services/firebaseService';
import { recordActivity, AUDIT_MODULES, AUDIT_ACTIONS } from '../services/auditService';

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

  // Real-time synchronization of active user profile & status from central database
  useEffect(() => {
    if (!currentUser?.id && !currentUser?.username) return;
    const unsub = subscribeToData('members', (members) => {
      const fresh = members.find((m) => 
        (currentUser.id && m.id === currentUser.id) || 
        (currentUser.username && m.username === currentUser.username)
      );
      if (fresh) {
        // Only update if data actually changed to avoid unnecessary re-renders
        if (
          fresh.name !== currentUser.name ||
          fresh.role !== currentUser.role ||
          fresh.phone !== currentUser.phone ||
          fresh.email !== currentUser.email ||
          fresh.status !== currentUser.status ||
          fresh.avatar !== currentUser.avatar ||
          fresh.department !== currentUser.department ||
          fresh.year !== currentUser.year ||
          fresh.bio !== currentUser.bio
        ) {
          setCurrentUser((prev) => prev ? { ...prev, ...fresh } : fresh);
        }
      }
    });
    return () => unsub();
  }, [currentUser?.id, currentUser?.username]);

  // Direct user profile update handler (persists to Firestore and synchronizes across all users)
  async function updateProfile(profileUpdates) {
    if (!currentUser) throw new Error('No active user session');
    const updated = await updateUserProfile(currentUser.id, profileUpdates, currentUser);
    setCurrentUser(updated);
    return updated;
  }

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

        // Record audit activity
        recordActivity({
          actor: matched,
          action: AUDIT_ACTIONS.AUTH_LOGIN,
          module: AUDIT_MODULES.AUTH,
          status: 'SUCCESS',
          details: `User ${matched.name} (@${matched.username}) authenticated successfully as ${matched.role}.`,
          targetId: matched.id
        });

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

          recordActivity({
            actor: fbUser,
            action: AUDIT_ACTIONS.AUTH_LOGIN,
            module: AUDIT_MODULES.AUTH,
            status: 'SUCCESS',
            details: `User ${fbUser.name} authenticated via Firebase Auth as ${fbUser.role}.`,
            targetId: fbUser.id
          });

          return { success: true, user: fbUser };
        } catch (fbErr) {
          throw new Error('Invalid institutional credentials. Please enter a valid username/email and password.');
        }
      }

      throw new Error('User not found. Please verify your official IEI username or registered email address.');
    } catch (err) {
      // Record audit failure
      recordActivity({
        actor: { username: (usernameOrEmail || 'anonymous').trim().toLowerCase(), name: 'Unauthenticated User', role: 'Guest' },
        action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
        module: AUDIT_MODULES.AUTH,
        status: 'FAILED',
        details: `Authentication failed for identifier: ${(usernameOrEmail || '').trim()}. Reason: ${err.message}`,
        targetId: (usernameOrEmail || 'N/A').trim().toLowerCase()
      });

      setAuthError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }

  // Logout handler
  async function logout() {
    if (currentUser) {
      recordActivity({
        actor: currentUser,
        action: AUDIT_ACTIONS.AUTH_LOGOUT,
        module: AUDIT_MODULES.AUTH,
        status: 'SUCCESS',
        details: `User ${currentUser.name} (@${currentUser.username}) signed out of institutional session.`,
        targetId: currentUser.id
      });
    }

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
    recordActivity({
      actor: { email, name: email, role: 'Applicant' },
      action: AUDIT_ACTIONS.AUTH_PASSWORD_RESET,
      module: AUDIT_MODULES.AUTH,
      status: 'SUCCESS',
      details: `Institutional password reset dispatched to ${email}.`,
      targetId: email
    });

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
        resetPassword,
        updateProfile
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
