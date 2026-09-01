import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the specific application
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('student_id', user.id)
      .single();

    if (appError) {
      console.error('Error fetching application:', appError);
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(application);

  } catch (error) {
    console.error('Error in application route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const updates = await request.json();

    // Update the application
    const { data: application, error: updateError } = await supabase
      .from('applications')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .eq('student_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      );
    }

    return NextResponse.json(application);

  } catch (error) {
    console.error('Error in application update route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete the application
    const { error: deleteError } = await supabase
      .from('applications')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('student_id', user.id);

    if (deleteError) {
      console.error('Error deleting application:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete application' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Application deleted successfully' });

  } catch (error) {
    console.error('Error in application delete route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 