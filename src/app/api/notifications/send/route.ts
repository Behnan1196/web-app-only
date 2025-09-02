import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { messaging } from '@/lib/firebase-admin';
import { 
  NotificationType, 
  buildChatNotification, 
  buildAssignmentNotification,
  buildSystemNotification,
  shouldSendNotification 
} from '../../../../shared/utils/notificationService';

interface SendNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  forceSend?: boolean; // Bypass smart filtering
}

export async function POST(request: NextRequest) {
  try {
    const { userId, type, title, body, data, forceSend = false }: SendNotificationRequest = await request.json();

    if (!userId || !type || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, body' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if user is currently in chat (unless force send is enabled)
    if (!forceSend) {
      const { data: activity } = await supabase
        .from('user_activity')
        .select('is_in_chat, last_activity')
        .eq('user_id', userId)
        .single();

      if (!shouldSendNotification(activity?.is_in_chat || false, activity?.last_activity)) {
        await logNotification(
          supabase,
          userId,
          type,
          title,
          body,
          'suppressed',
          'api'
        );
        
        return NextResponse.json({ 
          success: true, 
          status: 'suppressed',
          reason: 'User is in chat or within cooldown period'
        });
      }
    }

    // Get user's notification tokens
    const { data: tokens } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { error: 'No active notification tokens found for user' },
        { status: 404 }
      );
    }

    // Build notification payload based on type
    let notificationPayload;
    switch (type) {
      case NotificationType.CHAT_MESSAGE:
        notificationPayload = buildChatNotification(
          data?.senderName || 'Someone',
          body,
          data?.channelId || '',
          data?.messageId || '',
          data?.senderId || ''
        );
        break;
      case NotificationType.ASSIGNMENT:
        notificationPayload = buildAssignmentNotification(
          title,
          data?.dueDate
        );
        break;
      case NotificationType.SYSTEM:
        notificationPayload = buildSystemNotification(title, body, data);
        break;
      default:
        notificationPayload = {
          title,
          body,
          data: { type, ...data },
          icon: '/icon.png',
          badge: '/icon.png',
        };
    }

    // Send notifications to all platforms
    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        try {
          let status = 'sent';
          let errorMessage = '';

          if (token.platform === 'web' && token.token_type === 'fcm') {
            // Send FCM notification
            try {
              await messaging.send({
                token: token.token,
                notification: {
                  title: notificationPayload.title,
                  body: notificationPayload.body,
                },
                data: notificationPayload.data || {},
                webpush: {
                  notification: {
                    ...notificationPayload,
                    actions: notificationPayload.actions,
                  },
                },
              });
            } catch (error) {
              status = 'failed';
              errorMessage = error instanceof Error ? error.message : 'Unknown error';
            }
          } else if (token.platform === 'ios' || token.platform === 'android') {
            // For mobile, we'll use Expo push notifications
            // This would be handled by a separate service or the mobile app
            status = 'sent'; // Placeholder - actual implementation would call Expo API
          }

          // Log the notification
          await logNotification(
            supabase,
            userId,
            type,
            notificationPayload.title,
            notificationPayload.body,
            status,
            token.platform,
            errorMessage
          );

          return {
            platform: token.platform,
            status,
            error: errorMessage,
          };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          
          await logNotification(
            supabase,
            userId,
            type,
            title,
            body,
            'failed',
            token.platform,
            errorMsg
          );

          return {
            platform: token.platform,
            status: 'failed',
            error: errorMsg,
          };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 'sent').length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'failed')).length;

    return NextResponse.json({
      success: true,
      results: {
        total: tokens.length,
        successful,
        failed,
        details: results.map(r => r.status === 'fulfilled' ? r.value : { status: 'failed', error: 'Promise rejected' }),
      },
    });

  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function logNotification(
  supabase: any,
  userId: string,
  type: string,
  title: string,
  body: string,
  status: 'sent' | 'delivered' | 'failed' | 'suppressed',
  platform?: string,
  errorMessage?: string
) {
  try {
    await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        type,
        title,
        body,
        status,
        platform,
        error_message: errorMessage,
      });
  } catch (error) {
    console.error('Error logging notification:', error);
  }
}
