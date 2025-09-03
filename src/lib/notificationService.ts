// Unified Notification Service Interface
// This can be used by both web and mobile apps

export interface NotificationToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'web' | 'ios' | 'android';
  token_type: 'fcm' | 'expo' | 'apns';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  status: 'sent' | 'delivered' | 'failed' | 'suppressed';
  platform?: string;
  error_message?: string;
  sent_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  is_in_chat: boolean;
  last_activity: string;
  platform?: string;
  updated_at: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  sound?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface NotificationService {
  // Core methods
  initialize(userId: string): Promise<void>;
  registerToken(token: string, platform: 'web' | 'ios' | 'android', tokenType: 'fcm' | 'expo' | 'apns'): Promise<void>;
  updateActivity(isInChat: boolean): Promise<void>;
  setChatActivity(isInChat: boolean): void;
  
  // Logging and monitoring
  logNotification(
    type: string,
    title: string,
    body: string,
    status: 'sent' | 'delivered' | 'failed' | 'suppressed',
    platform?: string,
    errorMessage?: string
  ): Promise<void>;
  
  getTokens(): Promise<NotificationToken[]>;
  getLogs(limit?: number): Promise<NotificationLog[]>;
  
  // Utility methods
  isUserInChat(): boolean;
  cleanup(): void;
}

// Notification types
export enum NotificationType {
  CHAT_MESSAGE = 'chat_message',
  ASSIGNMENT = 'assignment',
  REMINDER = 'reminder',
  SYSTEM = 'system',
}

// Platform detection utilities
export const getPlatform = (): 'web' | 'ios' | 'android' => {
  if (typeof window !== 'undefined') {
    return 'web';
  }
  
  // This would be determined by the mobile app's Platform.OS
  return 'android'; // Default fallback
};

export const getTokenType = (platform: 'web' | 'ios' | 'android'): 'fcm' | 'expo' | 'apns' => {
  switch (platform) {
    case 'web':
      return 'fcm';
    case 'ios':
      return 'expo'; // Using Expo for cross-platform compatibility
    case 'android':
      return 'expo'; // Using Expo for cross-platform compatibility
    default:
      return 'fcm';
  }
};

// Smart notification filtering logic
export const shouldSendNotification = (
  isUserInChat: boolean,
  lastActivity?: string,
  cooldownMinutes: number = 1
): boolean => {
  // Don't send if user is actively in chat
  if (isUserInChat) {
    return false;
  }

  // Check cooldown period
  if (lastActivity) {
    const lastActivityTime = new Date(lastActivity);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastActivityTime.getTime()) / (1000 * 60);
    
    if (diffMinutes < cooldownMinutes) {
      return false;
    }
  }

  return true;
};

// Notification payload builders
export const buildChatNotification = (
  senderName: string,
  messageText: string,
  channelId: string,
  messageId: string,
  senderId: string
): NotificationPayload => ({
  title: `New message from ${senderName}`,
  body: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
  data: {
    type: NotificationType.CHAT_MESSAGE,
    channelId,
    messageId,
    senderId,
  },
  icon: '/icon.png',
  badge: '/icon.png',
  sound: 'default',
  actions: [
    {
      action: 'open',
      title: 'Open Chat',
      icon: '/icon.png',
    },
    {
      action: 'dismiss',
      title: 'Dismiss',
    },
  ],
});

export const buildAssignmentNotification = (
  assignmentTitle: string,
  dueDate?: string
): NotificationPayload => ({
  title: 'New Assignment',
  body: assignmentTitle,
  data: {
    type: NotificationType.ASSIGNMENT,
    dueDate,
  },
  icon: '/icon.png',
  badge: '/icon.png',
  sound: 'default',
  actions: [
    {
      action: 'view',
      title: 'View Assignment',
    },
  ],
});

export const buildSystemNotification = (
  title: string,
  body: string,
  data?: Record<string, any>
): NotificationPayload => ({
  title,
  body,
  data: {
    type: NotificationType.SYSTEM,
    ...data,
  },
  icon: '/icon.png',
  badge: '/icon.png',
  sound: 'default',
});

