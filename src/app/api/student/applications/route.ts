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

    // Get the user's applications
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (appsError) {
      console.error('Error fetching applications:', appsError);
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    return NextResponse.json(applications || []);

  } catch (error) {
    console.error('Error in applications route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const applicationData = await request.json();

    // Create new application
    const { data: application, error: createError } = await supabase
      .from('applications')
      .insert({
        student_id: user.id,
        university_name: applicationData.university_name,
        program_name: applicationData.program_name,
        status: applicationData.status || 'RESEARCHING',
        deadline: applicationData.deadline,
        application_fee: applicationData.application_fee
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating application:', createError);
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      );
    }

    return NextResponse.json(application);

  } catch (error) {
    console.error('Error in create application route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 