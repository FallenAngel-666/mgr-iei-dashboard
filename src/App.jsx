import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  
  // URL hash based view resolution: defaults to 'welcome'
  const [publicView, setPublicView] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#login') {
      return 'login';
    }
    return 'welcome';
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#login') {
        setPublicView('login');
      } else {
        setPublicView('welcome');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = '#login';
    }
    setPublicView('login');
  };

  const navigateToWelcome = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = '';
      if (window.history && window.history.pushState) {
        window.history.pushState('', document.title, window.location.pathname + window.location.search);
      }
    }
    setPublicView('welcome');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-iei-navy-950 flex flex-col items-center justify-center text-white selection:bg-amber-500 selection:text-slate-950">
        <div className="relative">
          <img 
            src="/assets/apk-logo.png" 
            alt="IEI Emblem" 
            className="w-16 h-16 animate-pulse"
          />
        </div>
        <p className="mt-4 text-xs font-semibold text-amber-400 uppercase tracking-widest">
          Authenticating IEI Dashboard System Session...
        </p>
      </div>
    );
  }

  // Strict route protection:
  // Unauthenticated visitors access the Public Welcome Page by default.
  // The dedicated Member Portal Sign In page opens ONLY when clicking "COMMITTEE LOGIN" (#login).
  if (!isAuthenticated) {
    if (publicView === 'login') {
      return <LoginPage onBackToWelcome={navigateToWelcome} />;
    }
    return <WelcomePage onNavigateToLogin={navigateToLogin} />;
  }

  // Protected Committee Member Dashboard
  return <DashboardPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
