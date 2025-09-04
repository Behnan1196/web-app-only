import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, token, platform, tokenType } = await request.json();

    console.log('📱 Token registration request:', { userId, token, platform, tokenType });

    if (!userId || !token || !platform || !tokenType) {
      console.error('❌ Missing required fields:', { userId, token, platform, tokenType });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if token already exists
    const { data: existingToken } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    if (existingToken) {
      // Update existing token
      const { error: updateError } = await supabase
        .from('notification_tokens')
        .update({
          token,
          token_type: tokenType,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingToken.id);

      if (updateError) {
        console.error('❌ Error updating token:', updateError);
        return NextResponse.json(
          { error: 'Failed to update token', details: updateError.message },
          { status: 500 }
        );
      }

      console.log('Token updated successfully');
      return NextResponse.json({ success: true, action: 'updated' });
    } else {
      // Create new token
      const { error: insertError } = await supabase
        .from('notification_tokens')
        .insert({
          user_id: userId,
          token,
          platform,
          token_type: tokenType,
          is_active: true,
        });

      if (insertError) {
        console.error('❌ Error inserting token:', insertError);
        return NextResponse.json(
          { error: 'Failed to insert token', details: insertError.message },
          { status: 500 }
        );
      }

      console.log('Token created successfully');
      return NextResponse.json({ success: true, action: 'created' });
    }
  } catch (error) {
    console.error('Token registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
