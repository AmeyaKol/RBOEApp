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

    // Get comments for the document
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!comments_user_id_fkey (
          full_name
        )
      `)
      .eq('document_id', resolvedParams.id)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    return NextResponse.json(comments || []);

  } catch (error) {
    console.error('Error in comments route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const commentData = await request.json();

    // Create new comment
    const { data: comment, error: createError } = await supabase
      .from('comments')
      .insert({
        document_id: resolvedParams.id,
        user_id: user.id,
        content: commentData.content,
        position_start: commentData.position_start || null,
        position_end: commentData.position_end || null
      })
      .select(`
        *,
        profiles!comments_user_id_fkey (
          full_name
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating comment:', createError);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    return NextResponse.json(comment);

  } catch (error) {
    console.error('Error in create comment route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 