import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [publicView, setPublicView] = useState('welcome'); // 'welcome' | 'login'

  if (loading) {
    return (
      <div className="min-h-screen bg-iei-navy-950 flex flex-col items-center justify-center text-white">
        <div className="relative">
          <img 
            src="./assets/apk-logo.png" 
            alt="IEI Emblem" 
            className="w-16 h-16 animate-pulse"
          />
        </div>
        <p className="mt-4 text-xs font-semibold text-iei-gold-400 uppercase tracking-widest">
          Authenticating IEI Institutional Session...
        </p>
      </div>
    );
  }

  // Strict protected route enforcement:
  // Unauthenticated visitors access the Public Welcome Page by default,
  // or the separate Committee Member Login page when chosen.
  if (!isAuthenticated) {
    if (publicView === 'login') {
      return <LoginPage onBackToWelcome={() => setPublicView('welcome')} />;
    }
    return <WelcomePage onNavigateToLogin={() => setPublicView('login')} />;
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
