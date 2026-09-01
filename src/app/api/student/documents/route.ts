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

    // Get the user's documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json(documents || []);

  } catch (error) {
    console.error('Error in documents route:', error);
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

    const documentData = await request.json();

    // Master documents are singletons per (student, type). If one already exists,
    // return it instead of creating a duplicate — the old client POSTed a fresh
    // master on every page load, which spawned dozens of empty copies.
    if (documentData.is_master) {
      const { data: existingMaster } = await supabase
        .from('documents')
        .select('*')
        .eq('student_id', user.id)
        .eq('type', documentData.type)
        .eq('is_master', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingMaster) {
        return NextResponse.json(existingMaster);
      }
    }

    // Create new document
    const { data: document, error: createError } = await supabase
      .from('documents')
      .insert({
        student_id: user.id,
        type: documentData.type,
        title: documentData.title,
        content: documentData.content || '',
        is_master: documentData.is_master || false,
        version: 1
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating document:', createError);
      return NextResponse.json(
        { error: 'Failed to create document' },
        { status: 500 }
      );
    }

    return NextResponse.json(document);

  } catch (error) {
    console.error('Error in create document route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 