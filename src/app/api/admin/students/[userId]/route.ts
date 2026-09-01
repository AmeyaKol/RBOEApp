import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || adminProfile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { userId } = params;

    const { data: studentProfile, error: studentError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'STUDENT')
      .single();

    if (studentError || !studentProfile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const { data: applications } = await supabase
      .from('applications')
      .select('*')
      .eq('student_id', userId)
      .order('created_at', { ascending: false });

    const { data: requests } = await supabase
      .from('requests')
      .select('*')
      .eq('student_id', userId)
      .order('created_at', { ascending: false });

    const { data: documents } = await supabase
      .from('documents')
      .select('id, type, title, content, is_master, version, updated_at')
      .eq('student_id', userId)
      .order('is_master', { ascending: false })
      .order('updated_at', { ascending: false });

    return NextResponse.json({
      ...studentProfile,
      applications: applications || [],
      requests: requests || [],
      documents: documents || [],
    });
  } catch (error) {
    console.error('Error in admin student detail route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
