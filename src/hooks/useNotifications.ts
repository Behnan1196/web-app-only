import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/lib/notifications';
import { NotificationLog, NotificationToken } from '@/lib/notifications';

export interface UseNotificationsReturn {
  // State
  isInitialized: boolean;
  isInChat: boolean;
  tokens: NotificationToken[];
  logs: NotificationLog[];
  permission: NotificationPermission;
  
  // Actions
  initialize: () => Promise<void>;
  setChatActivity: (isInChat: boolean) => void;
  refreshTokens: () => Promise<void>;
  refreshLogs: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
  cleanup: () => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInChat, setIsInChat] = useState(false);
  const [tokens, setTokens] = useState<NotificationToken[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const initialize = useCallback(async () => {
    if (!user?.id) {
      console.warn('Cannot initialize notifications: user not authenticated');
      return;
    }

    console.log('useNotifications - starting initialization for user:', user.id);

    try {
      // Check current permission status
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }

      // Initialize notification service
      await notificationService.initialize(user.id);
      setIsInitialized(true);

      // Load initial data
      await Promise.all([
        refreshTokens(),
        refreshLogs(),
      ]);

      console.log('Notifications initialized successfully');
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }, [user?.id]);

  const setChatActivity = useCallback((inChat: boolean) => {
    setIsInChat(inChat);
    notificationService.setChatActivity(inChat);
  }, []);

  const refreshTokens = useCallback(async () => {
    try {
      const userTokens = await notificationService.getTokens();
      setTokens(userTokens);
    } catch (error) {
      console.error('Error refreshing tokens:', error);
    }
  }, []);

  const refreshLogs = useCallback(async () => {
    try {
      const userLogs = await notificationService.getLogs();
      setLogs(userLogs);
    } catch (error) {
      console.error('Error refreshing logs:', error);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }, []);

  const cleanup = useCallback(() => {
    notificationService.cleanup();
    setIsInitialized(false);
    setIsInChat(false);
    setTokens([]);
    setLogs([]);
  }, []);

  // Initialize when user changes
  useEffect(() => {
    if (user?.id && !isInitialized) {
      console.log('useNotifications - initializing for user:', user.id);
      initialize();
    } else if (!user?.id && isInitialized) {
      console.log('useNotifications - cleaning up, no user');
      cleanup();
    }
  }, [user?.id, isInitialized, initialize, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Track page visibility for activity updates
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, user is not actively using the app
        setChatActivity(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setChatActivity]);

  return {
    isInitialized,
    isInChat,
    tokens,
    logs,
    permission,
    initialize,
    setChatActivity,
    refreshTokens,
    refreshLogs,
    requestPermission,
    cleanup,
  };
};
