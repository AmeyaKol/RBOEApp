import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({
      cookies: () => cookies(),
    });

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

    const updates = await request.json() as Record<string, unknown>;
    const resolvedParams = await params;

    // Update the request. The acting admin is always the authenticated user.
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      admin_id: user.id,
    };

    if (updates.status) {
      updateData.status = updates.status;
    }
    if (updates.admin_response) {
      updateData.admin_response = updates.admin_response;
      updateData.responded_at = new Date().toISOString();
    }
    if (
      typeof updates.urgency === "string" &&
      ["LOW", "NORMAL", "HIGH", "CRITICAL"].includes(updates.urgency)
    ) {
      // admin re-triage; the sync trigger updates is_urgent
      updateData.urgency = updates.urgency;
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select(`
        *,
        profiles!requests_student_id_fkey (
          full_name,
          gre_score,
          toefl_score
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating request:', updateError);
      return NextResponse.json(
        { error: 'Failed to update request' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedRequest);

  } catch (error) {
    console.error('Error in request update route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 