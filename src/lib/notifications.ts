import { messaging, VAPID_KEY } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { supabase } from './supabase';

export interface NotificationToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'web' | 'ios' | 'android';
  token_type: 'fcm' | 'expo' | 'apns';
  is_active: boolean;
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

class NotificationService {
  private isInChat = false;
  private currentUserId: string | null = null;

  constructor() {
    this.setupMessageListener();
  }

  /**
   * Initialize notification service for the current user
   */
  async initialize(userId: string): Promise<void> {
    this.currentUserId = userId;
    
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }

    // Get FCM token
    if (messaging) {
      try {
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
        });

        if (token) {
          await this.registerToken(token, 'web', 'fcm');
          console.log('FCM token registered:', token);
        }
      } catch (error) {
        console.error('Error getting FCM token:', error);
      }
    }
  }

  /**
   * Register notification token for the current user
   */
  async registerToken(token: string, platform: 'web' | 'ios' | 'android', tokenType: 'fcm' | 'expo' | 'apns'): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('notification_tokens')
      .upsert({
        user_id: this.currentUserId,
        token,
        platform,
        token_type: tokenType,
        is_active: true,
      }, {
        onConflict: 'user_id,platform'
      });

    if (error) {
      console.error('Error registering notification token:', error);
      throw error;
    }
  }

  /**
   * Update user activity status
   */
  async updateActivity(isInChat: boolean): Promise<void> {
    if (!this.currentUserId) {
      return;
    }

    this.isInChat = isInChat;

    const { error } = await supabase
      .from('user_activity')
      .upsert({
        user_id: this.currentUserId,
        is_in_chat: isInChat,
        last_activity: new Date().toISOString(),
        platform: 'web',
      }, {
        onConflict: 'user_id,platform'
      });

    if (error) {
      console.error('Error updating user activity:', error);
    }
  }

  /**
   * Set chat activity status
   */
  setChatActivity(isInChat: boolean): void {
    this.updateActivity(isInChat);
  }

  /**
   * Setup message listener for foreground notifications
   */
  private setupMessageListener(): void {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('Message received in foreground:', payload);
        
        // Show notification manually when app is in foreground
        if (payload.notification) {
          const notification = new Notification(payload.notification.title || 'New Message', {
            body: payload.notification.body,
            icon: '/icon.png',
            badge: '/icon.png',
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }
      });
    }
  }

  /**
   * Log notification delivery
   */
  async logNotification(
    type: string,
    title: string,
    body: string,
    status: 'sent' | 'delivered' | 'failed' | 'suppressed',
    platform?: string,
    errorMessage?: string
  ): Promise<void> {
    if (!this.currentUserId) {
      return;
    }

    const { error } = await supabase
      .from('notification_logs')
      .insert({
        user_id: this.currentUserId,
        type,
        title,
        body,
        status,
        platform,
        error_message: errorMessage,
      });

    if (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Get user's notification tokens
   */
  async getTokens(): Promise<NotificationToken[]> {
    if (!this.currentUserId) {
      return [];
    }

    const { data, error } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('user_id', this.currentUserId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching notification tokens:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user's notification logs
   */
  async getLogs(limit = 50): Promise<NotificationLog[]> {
    if (!this.currentUserId) {
      return [];
    }

    const { data, error } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('user_id', this.currentUserId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notification logs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Check if user is currently in chat
   */
  isUserInChat(): boolean {
    return this.isInChat;
  }

  /**
   * Cleanup method
   */
  cleanup(): void {
    this.currentUserId = null;
    this.isInChat = false;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
