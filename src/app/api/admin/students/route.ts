import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Build query for students
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'STUDENT');

    // Add search filter if provided
    if (search) {
      query = query.ilike('full_name', `%${search}%`);
    }

    const { data: students, error: studentsError } = await query
      .order('created_at', { ascending: false });

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

    // For each student, get their application data
    const studentsWithData = await Promise.all(
      (students || []).map(async (student) => {
        // Get applications count and status
        const { data: applications, error: appsError } = await supabase
          .from('applications')
          .select('status, deadline')
          .eq('student_id', student.user_id);

        // Get pending requests count
        const { data: requests, error: reqError } = await supabase
          .from('requests')
          .select('id')
          .eq('student_id', student.user_id)
          .in('status', ['OPEN', 'IN_PROGRESS']);

        // Calculate next deadline
        const upcomingApplications = applications?.filter(app => {
          if (!app.deadline) return false;
          const deadline = new Date(app.deadline);
          const now = new Date();
          return deadline > now;
        }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

        const nextDeadline = upcomingApplications?.[0]?.deadline;

        return {
          ...student,
          applications: {
            total: applications?.length || 0,
            submitted: applications?.filter(app => app.status === 'APPLIED').length || 0,
            accepted: applications?.filter(app => app.status === 'ACCEPTED').length || 0,
            next_deadline: nextDeadline
          },
          pending_requests: requests?.length || 0
        };
      })
    );

    return NextResponse.json(studentsWithData);

  } catch (error) {
    console.error('Error in admin students route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 