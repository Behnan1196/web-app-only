'use client';

import React, { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

interface ChatWithNotificationsProps {
  children: React.ReactNode;
  channelId?: string;
}

/**
 * Wrapper component that automatically tracks chat activity for smart notifications
 * Wrap your chat components with this to enable smart notification filtering
 */
export const ChatWithNotifications: React.FC<ChatWithNotificationsProps> = ({ 
  children, 
  channelId 
}) => {
  const { setChatActivity, isInitialized } = useNotifications();

  // Track when user enters/leaves chat
  useEffect(() => {
    if (!isInitialized) return;

    // Set chat activity to true when component mounts
    setChatActivity(true);

    // Set chat activity to false when component unmounts
    return () => {
      setChatActivity(false);
    };
  }, [setChatActivity, isInitialized, channelId]);

  // Track focus/blur events for more precise activity tracking
  useEffect(() => {
    if (!isInitialized) return;

    const handleFocus = () => setChatActivity(true);
    const handleBlur = () => setChatActivity(false);

    // Track window focus/blur
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Track document visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        setChatActivity(false);
      } else {
        setChatActivity(true);
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', () => {});
    };
  }, [setChatActivity, isInitialized]);

  return <>{children}</>;
};
