import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-iei-navy-950 flex flex-col items-center justify-center text-white">
        <div className="relative">
          <img 
            src="/assets/apk-logo.png" 
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

  // Strict protected route enforcement: unauthenticated users MUST see LoginPage
  if (!isAuthenticated) {
    return <LoginPage />;
  }

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
