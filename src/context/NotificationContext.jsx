import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  subscribeToData, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../services/firebaseService';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [allNotifications, setAllNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToData('notifications', (notifs) => {
      if (!currentUser) {
        setAllNotifications([]);
        setUnreadCount(0);
        return;
      }

      // Filter targeted notifications for current user
      const userNotifs = notifs.filter((n) => {
        if (n.recipientId === 'all') return true;
        if (n.recipientId === currentUser.id) return true;
        if (n.recipientRole && n.recipientRole === currentUser.role) return true;
        return false;
      });

      setAllNotifications(userNotifs);
      setUnreadCount(userNotifs.filter((n) => !n.read).length);
    });

    return unsubscribe;
  }, [currentUser]);

  const markRead = async (id) => {
    await markNotificationAsRead(id);
  };

  const markAllRead = async () => {
    if (currentUser) {
      await markAllNotificationsAsRead(currentUser.id, currentUser.role);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: allNotifications,
        unreadCount,
        markRead,
        markAllRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
