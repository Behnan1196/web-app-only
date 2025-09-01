import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user ID from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token and get user info
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.id;

    // Get user profile to determine role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get assigned partner based on role
    if (userProfile.role === 'student') {
      // Get the coach assigned to this student
      const { data: assignment, error: assignmentError } = await supabase
        .from('student_coach_assignments')
        .select('*')
        .eq('student_id', userId)
        .single();

      if (assignmentError || !assignment) {
        return NextResponse.json({ error: 'No coach assigned' }, { status: 404 });
      }

      // Get coach profile
      const { data: coachProfile, error: coachError } = await supabase
        .from('users')
        .select('*')
        .eq('id', assignment.coach_id)
        .single();

      if (coachError || !coachProfile) {
        return NextResponse.json({ error: 'Coach profile not found' }, { status: 404 });
      }

      return NextResponse.json(coachProfile);
    } else if (userProfile.role === 'coach') {
      // Get the student assigned to this coach
      const { data: assignment, error: assignmentError } = await supabase
        .from('student_coach_assignments')
        .select('*')
        .eq('coach_id', userId)
        .single();

      if (assignmentError || !assignment) {
        return NextResponse.json({ error: 'No student assigned' }, { status: 404 });
      }

      // Get student profile
      const { data: studentProfile, error: studentError } = await supabase
        .from('users')
        .select('*')
        .eq('id', assignment.student_id)
        .single();

      if (studentError || !studentProfile) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
      }

      return NextResponse.json(studentProfile);
    } else {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching assigned partner:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
