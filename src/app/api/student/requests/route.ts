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

    // Get the user's requests + any linked document / application
    const { data: requests, error: requestsError } = await supabase
      .from('requests')
      .select(`
        *,
        documents ( id, title, type ),
        applications ( id, university_name, program_name )
      `)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      );
    }

    return NextResponse.json(requests || []);

  } catch (error) {
    console.error('Error in requests route:', error);
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

    const requestData = await request.json();

    // Create new request
    const { data: newRequest, error: createError } = await supabase
      .from('requests')
      .insert({
        student_id: user.id,
        title: requestData.title,
        description: requestData.description,
        status: 'OPEN',
        is_urgent: requestData.is_urgent || false,
        urgent_reason: requestData.urgent_reason || null,
        // A request can link a document or a university application (not both).
        // These columns require migration 001.
        ...(requestData.document_id ? { document_id: requestData.document_id } : {}),
        ...(requestData.application_id ? { application_id: requestData.application_id } : {}),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating request:', createError);
      return NextResponse.json(
        { error: 'Failed to create request' },
        { status: 500 }
      );
    }

    return NextResponse.json(newRequest);

  } catch (error) {
    console.error('Error in create request route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 