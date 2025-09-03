import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createAdminClient();
    
    // Test database connection
    const { data: tokens, error: tokensError } = await supabase
      .from('notification_tokens')
      .select('*')
      .limit(5);
    
    const { data: logs, error: logsError } = await supabase
      .from('notification_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(5);
    
    const { data: activity, error: activityError } = await supabase
      .from('user_activity')
      .select('*')
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        tokens: tokens || [],
        logs: logs || [],
        activity: activity || [],
        errors: {
          tokens: tokensError?.message,
          logs: logsError?.message,
          activity: activityError?.message,
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
