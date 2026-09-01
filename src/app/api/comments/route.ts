import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Comments anchored to either a document or an application.
 *
 * Authorization is entirely RLS: a user can read/write a comment only when they
 * own the anchor (document.student_id / application.student_id) or they are an
 * ADMIN. An unauthorized GET simply returns an empty list.
 *
 * Author name/role are denormalised onto the row at insert time — `profiles`
 * RLS hides an admin's profile from a student, so an embedded join would render
 * admin comments as "User" on the student side.
 *
 *   GET  /api/comments?documentId=<uuid>
 *   GET  /api/comments?applicationId=<uuid>
 *   POST /api/comments   { content, document_id? | application_id? }
 */

const COMMENT_SELECT = `
  id,
  document_id,
  application_id,
  user_id,
  content,
  author_name,
  author_role,
  position_start,
  position_end,
  created_at
`;

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const applicationId = searchParams.get('applicationId');

    if ((!documentId && !applicationId) || (documentId && applicationId)) {
      return NextResponse.json(
        { error: 'Provide exactly one of documentId or applicationId' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('comments')
      .select(COMMENT_SELECT)
      .order('created_at', { ascending: true });

    query = documentId
      ? query.eq('document_id', documentId)
      : query.eq('application_id', applicationId as string);

    const { data: comments, error } = await query;

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json(comments || []);
  } catch (error) {
    console.error('Error in comments route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      content?: string;
      document_id?: string | null;
      application_id?: string | null;
    };

    const content = body.content?.trim();
    const documentId = body.document_id || null;
    const applicationId = body.application_id || null;

    if (!content) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }
    if ((!documentId && !applicationId) || (documentId && applicationId)) {
      return NextResponse.json(
        { error: 'Provide exactly one of document_id or application_id' },
        { status: 400 }
      );
    }

    // Caller can always read their own profile.
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('user_id', user.id)
      .single();

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        document_id: documentId,
        application_id: applicationId,
        user_id: user.id,
        content,
        author_name: authorProfile?.full_name ?? null,
        author_role: authorProfile?.role ?? null,
        position_start: null,
        position_end: null,
      })
      .select(COMMENT_SELECT)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      // RLS denial surfaces here as a permission error.
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error in create comment route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
