import { NextRequest, NextResponse } from 'next/server';

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

    // Call the webhook endpoint internally
    const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/webhook`;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    if (response.ok) {
      console.log('✅ Test webhook sent successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Test webhook sent successfully',
        payload: testPayload
      });
    } else {
      const errorText = await response.text();
      console.error('❌ Test webhook failed:', response.status, errorText);
      return NextResponse.json({ 
        success: false, 
        error: 'Test webhook failed',
        status: response.status,
        details: errorText
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Test webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
