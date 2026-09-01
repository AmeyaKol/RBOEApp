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

    // Get total students count
    const { count: totalStudents, error: studentsError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'STUDENT');

    // Get total applications count
    const { count: totalApplications, error: appsError } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true });

    // Get application statistics
    const { data: applicationStats, error: statsError } = await supabase
      .from('applications')
      .select('status');

    // Get pending requests count
    const { count: pendingRequests, error: requestsError } = await supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['OPEN', 'IN_PROGRESS']);

    // Get recent requests for dashboard
    const { data: recentRequests, error: recentError } = await supabase
      .from('requests')
      .select(`
        *,
        profiles!requests_student_id_fkey (
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get students with upcoming deadlines
    const { data: deadlines, error: deadlinesError } = await supabase
      .from('applications')
      .select(`
        deadline,
        university_name,
        program_name,
        status,
        profiles!applications_student_id_fkey (
          full_name
        )
      `)
      .not('deadline', 'is', null)
      .gte('deadline', new Date().toISOString().slice(0, 10))
      .order('deadline', { ascending: true })
      .limit(8);

    // Build a recent-activity feed from the latest request / document / application changes
    const [recentDocs, recentApps] = await Promise.all([
      supabase
        .from('documents')
        .select('id, title, type, updated_at, profiles!documents_student_id_fkey ( full_name )')
        .order('updated_at', { ascending: false })
        .limit(6),
      supabase
        .from('applications')
        .select('id, university_name, status, updated_at, profiles!applications_student_id_fkey ( full_name )')
        .order('updated_at', { ascending: false })
        .limit(6),
    ]);

    type ActivityItem = { kind: 'request' | 'document' | 'application'; text: string; detail: string; at: string };
    const activity: ActivityItem[] = [];
    for (const r of recentRequests || []) {
      activity.push({
        kind: 'request',
        text: `${r.profiles?.full_name || 'A student'} — ${r.title}`,
        detail: r.is_urgent ? 'Urgent request' : 'New request',
        at: r.created_at,
      });
    }
    for (const d of recentDocs.data || []) {
      activity.push({
        kind: 'document',
        text: `${d.profiles?.full_name || 'A student'} updated ${d.title}`,
        detail: `${d.type} document`,
        at: d.updated_at,
      });
    }
    for (const a of recentApps.data || []) {
      activity.push({
        kind: 'application',
        text: `${a.profiles?.full_name || 'A student'} — ${a.university_name}`,
        detail: `Application ${String(a.status).toLowerCase()}`,
        at: a.updated_at,
      });
    }
    activity.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime());

    // Calculate application stats
    const acceptedCount = applicationStats?.filter(app => app.status === 'ACCEPTED').length || 0;
    const inProgressCount = applicationStats?.filter(app => ['APPLYING', 'APPLIED'].includes(app.status)).length || 0;
    const rejectedCount = applicationStats?.filter(app => app.status === 'REJECTED').length || 0;

    // Calculate success rate
    const completedApplications = acceptedCount + rejectedCount;
    const successRate = completedApplications > 0 ? Math.round((acceptedCount / completedApplications) * 100) : 0;

    const dashboardData = {
      stats: {
        totalStudents: totalStudents || 0,
        totalApplications: totalApplications || 0,
        pendingRequests: pendingRequests || 0,
        successRate: `${successRate}%`
      },
      applicationStats: {
        total: totalApplications || 0,
        accepted: acceptedCount,
        inProgress: inProgressCount,
        rejected: rejectedCount
      },
      recentRequests: recentRequests || [],
      upcomingDeadlines: deadlines || [],
      recentActivity: activity.slice(0, 8),
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Error in admin dashboard route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 