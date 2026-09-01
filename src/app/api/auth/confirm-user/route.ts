import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get the user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError);
      return NextResponse.json(
        { error: 'Failed to access user data' },
        { status: 500 }
      );
    }

    const user = users.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update the user to confirm their email
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error('Error confirming user:', updateError);
      return NextResponse.json(
        { error: 'Failed to confirm user' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'User confirmed successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in confirm-user route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 