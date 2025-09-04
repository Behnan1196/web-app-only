import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { messaging } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test webhook endpoint called');
    const { message, channelId, userId } = await request.json();
    console.log('📱 Test webhook params:', { message, channelId, userId });

    // Create a test webhook payload
    const testPayload = {
      type: 'message.new',
      cid: channelId || 'coaching-6dd5528d-83ba38a0',
      message: {
        id: `test-${Date.now()}`,
        text: message || 'Test message from webhook test',
        html: `<p>${message || 'Test message from webhook test'}</p>`,
        type: 'regular',
        user: {
          id: userId || '83ba38a0-7ace-409a-aed9-4f3d8d044d6d',
          name: 'Test User',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      channel: {
        id: channelId || 'coaching-6dd5528d-83ba38a0',
        type: 'messaging',
        cid: channelId || 'coaching-6dd5528d-83ba38a0',
        name: 'Test Channel',
      },
      members: [
        {
          user_id: '6dd5528d-2545-4d85-a80a-43355913ec49',
          user: {
            id: '6dd5528d-2545-4d85-a80a-43355913ec49',
            name: 'Ozan',
          },
        },
        {
          user_id: '83ba38a0-7ace-409a-aed9-4f3d8d044d6d',
          user: {
            id: '83ba38a0-7ace-409a-aed9-4f3d8d044d6d',
            name: 'Behnan',
          },
        },
      ],
    };

    // Process the webhook directly instead of making HTTP call
    console.log('🔔 Processing test webhook directly...');
    
    // Get notification tokens for the channel members
    const supabase = createAdminClient();
    const memberIds = testPayload.members.map(member => member.user_id);
    
    const { data: tokens, error: tokensError } = await supabase
      .from('notification_tokens')
      .select('*')
      .in('user_id', memberIds)
      .eq('is_active', true);

    if (tokensError) {
      console.error('❌ Error fetching tokens:', tokensError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch notification tokens',
        details: tokensError.message
      }, { status: 500 });
    }

    console.log('📱 Found tokens:', tokens?.length || 0);

    // Send notifications to each token
    const notificationResults = [];
    for (const token of tokens || []) {
      try {
        const notification = {
          title: `New message from ${testPayload.message.user.name}`,
          body: testPayload.message.text,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: {
            channelId: testPayload.channel.id,
            messageId: testPayload.message.id,
            senderId: testPayload.message.user.id,
            type: 'chat_message'
          }
        };

        let status = 'failed';
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
              status = 'sent';
            } catch (error) {
              status = 'failed';
              errorMessage = error instanceof Error ? error.message : 'Unknown error';
            }
          }
        } else if (token.platform === 'ios' || token.platform === 'android') {
          // Check if it's a mock token (development build)
          if (token.token.startsWith('mock-')) {
            console.log('📱 Mock token detected - skipping push notification (will use local notification)');
            status = 'mock';
            errorMessage = 'Mock token - local notification will be used';
          } else {
            // Send Expo push notification for real tokens
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
        }

        notificationResults.push({
          tokenId: token.id,
          platform: token.platform,
          status,
          error: errorMessage
        });

        // Log notification result
        await supabase.from('notification_logs').insert({
          user_id: token.user_id,
          type: 'chat_message',
          title: notification.title,
          body: notification.body,
          status,
          platform: token.platform,
          error_message: errorMessage
        });

      } catch (error) {
        console.error('❌ Error processing token:', token.id, error);
        notificationResults.push({
          tokenId: token.id,
          platform: token.platform,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('✅ Test webhook processed successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Test webhook processed successfully',
      payload: testPayload,
      results: notificationResults
    });
  } catch (error) {
    console.error('❌ Test webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
