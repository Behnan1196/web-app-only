import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { messaging } from '@/lib/firebase-admin';

interface StreamWebhookPayload {
  type: string;
  cid: string;
  message: {
    id: string;
    text: string;
    html: string;
    type: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
    created_at: string;
    updated_at: string;
  };
  channel: {
    id: string;
    type: string;
    cid: string;
    name?: string;
    image?: string;
  };
  members: Array<{
    user_id: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const payload: StreamWebhookPayload = await request.json();
    
    // Note: Stream.io webhook signature verification can be added later if needed
    // For now, we'll process all webhook requests
    console.log('Stream.io webhook received:', payload.type);

    // Only process message.new events
    if (payload.type !== 'message.new') {
      return NextResponse.json({ success: true });
    }

    const supabase = createAdminClient();
    const message = payload.message;
    const channel = payload.channel;
    const sender = message.user;

    // Get all members except the sender
    const recipients = payload.members
      .filter(member => member.user_id !== sender.id)
      .map(member => member.user_id);

    if (recipients.length === 0) {
      return NextResponse.json({ success: true });
    }

    // Process notifications for each recipient
    const notificationPromises = recipients.map(async (userId) => {
      try {
        // Check if user is currently in chat
        const { data: activity } = await supabase
          .from('user_activity')
          .select('is_in_chat, last_activity')
          .eq('user_id', userId)
          .single();

        // Skip notification if user is actively in chat
        if (activity?.is_in_chat) {
          await logNotification(
            supabase,
            userId,
            'chat_message',
            `New message from ${sender.name}`,
            message.text,
            'suppressed',
            'webhook'
          );
          return;
        }

        // Get user's notification tokens
        const { data: tokens } = await supabase
          .from('notification_tokens')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (!tokens || tokens.length === 0) {
          return;
        }

        // Send notifications to all platforms
        const notificationPromises = tokens.map(async (token) => {
          try {
            const notification = {
              title: `New message from ${sender.name}`,
              body: message.text.length > 100 ? message.text.substring(0, 100) + '...' : message.text,
              icon: sender.image || '/icon.png',
              badge: '/icon.png',
              data: {
                channelId: channel.id,
                messageId: message.id,
                senderId: sender.id,
                type: 'chat_message'
              }
            };

            let status: 'sent' | 'delivered' | 'failed' | 'suppressed' = 'sent';
            let errorMessage = '';

            if (token.platform === 'web' && token.token_type === 'fcm') {
              // Send FCM notification
              if (!messaging) {
                status = 'failed';
                errorMessage = 'Firebase Admin SDK not initialized';
              } else {
                try {
                  await messaging.send({
                    token: token.token,
                    notification: {
                      title: notification.title,
                      body: notification.body
                    },
                    webpush: {
                      notification: {
                        title: notification.title,
                        body: notification.body,
                        icon: notification.icon,
                        badge: notification.badge,
                        actions: [
                          {
                            action: 'open',
                            title: 'Open Chat'
                          }
                        ]
                      },
                      data: notification.data
                    }
                  });
                } catch (error) {
                  status = 'failed';
                  errorMessage = error instanceof Error ? error.message : 'Unknown error';
                }
              }
            } else if (token.platform === 'ios' || token.platform === 'android') {
              // Send Expo push notification
              try {
                const expoPushMessage = {
                  to: token.token,
                  title: notification.title,
                  body: notification.body,
                  data: notification.data,
                  sound: 'default',
                  badge: 1,
                };

                const response = await fetch('https://exp.host/--/api/v2/push/send', {
                  method: 'POST',
                  headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(expoPushMessage),
                });

                if (!response.ok) {
                  const errorData = await response.text();
                  status = 'failed';
                  errorMessage = `Expo push failed: ${response.status} ${errorData}`;
                } else {
                  status = 'sent';
                }
              } catch (error) {
                status = 'failed';
                errorMessage = error instanceof Error ? error.message : 'Unknown error';
              }
            }

            // Log the notification
            await logNotification(
              supabase,
              userId,
              'chat_message',
              notification.title,
              notification.body,
              status,
              token.platform,
              errorMessage
            );

          } catch (error) {
            console.error(`Error sending notification to ${token.platform}:`, error);
            await logNotification(
              supabase,
              userId,
              'chat_message',
              `New message from ${sender.name}`,
              message.text,
              'failed',
              token.platform,
              error instanceof Error ? error.message : 'Unknown error'
            );
          }
        });

        await Promise.all(notificationPromises);

      } catch (error) {
        console.error(`Error processing notification for user ${userId}:`, error);
      }
    });

    await Promise.all(notificationPromises);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
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
