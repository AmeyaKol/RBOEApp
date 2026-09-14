import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

    // Snapshot the superseded version when the content actually changes, so the
    // version history reflects both student and admin edits.
    if (typeof updates.content === 'string') {
      const { data: current } = await supabase
        .from('documents')
        .select('content, version')
        .eq('id', resolvedParams.id)
        .eq('student_id', user.id)
        .single();

      if (current && (current.content ?? '') !== updates.content) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();

        await supabase.from('document_versions').insert({
          document_id: resolvedParams.id,
          version: current.version ?? 1,
          content: current.content ?? '',
          version_note: updates.version_note || null,
          edited_by: user.id,
          editor_name: prof?.full_name ?? 'Student',
          editor_role: 'STUDENT',
        });
        updates.version = (current.version ?? 1) + 1;
      }
    }
    delete updates.version_note;

    // Update the document
    const { data: document, error: updateError } = await supabase
      .from('documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .eq('student_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating document:', updateError);
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      );
    }

    return NextResponse.json(document);

  } catch (error) {
    console.error('Error in document update route:', error);
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

    // Delete the document
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('student_id', user.id);

    if (deleteError) {
      console.error('Error deleting document:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Document deleted successfully' });

  } catch (error) {
    console.error('Error in document delete route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 