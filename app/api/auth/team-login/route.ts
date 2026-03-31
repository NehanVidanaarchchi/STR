// import { NextResponse } from 'next/server';
// import { createClient } from '@/lib/supabase/server';
// import bcrypt from 'bcryptjs';
// import { cookies } from 'next/headers';

// export async function POST(request: Request) {
//   try {
//     const { email, password } = await request.json();

//     if (!email || !password) {
//       return NextResponse.json(
//         { error: 'Email and password are required' },
//         { status: 400 }
//       );
//     }

//     const supabase = await createClient();

//     // Fetch team member by email
//     const { data: teamMember, error } = await supabase
//       .from('team_members')
//       .select(`
//         id,
//         full_name,
//         email,
//         password_hash,
//         status,
//         role,
//         provider_id
//       `)
//       .eq('email', email)
//       .single();

//     if (error || !teamMember) {
//       return NextResponse.json(
//         { error: 'Invalid email or password' },
//         { status: 401 }
//       );
//     }

//     // Check if team member is active
//     if (teamMember.status !== 'active') {
//       return NextResponse.json(
//         { error: 'Your account is not active. Please check your email for activation link or contact your administrator.' },
//         { status: 403 }
//       );
//     }

//     // Check if password is set
//     if (!teamMember.password_hash) {
//       return NextResponse.json(
//         { error: 'Password not set. Please use the setup link sent to your email.' },
//         { status: 403 }
//       );
//     }

//     // Verify password
//     const isValidPassword = await bcrypt.compare(
//       password,
//       teamMember.password_hash
//     );

//     if (!isValidPassword) {
//       return NextResponse.json(
//         { error: 'Invalid email or password' },
//         { status: 401 }
//       );
//     }

//     // Store team member session
//     (await cookies()).set(
//       'team_member_session',
//       JSON.stringify({
//         id: teamMember.id,
//         email: teamMember.email,
//         name: teamMember.full_name,
//         role: teamMember.role,
//         provider_id: teamMember.provider_id,
//         type: 'team_member' // Important: differentiate session type
//       }),
//       {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'lax',
//         path: '/',
//         maxAge: 60 * 60 * 24, // 1 day
//       }
//     );

//     return NextResponse.json({
//       success: true,
//       message: 'Login successful',
//       user_type: 'team_member',
//       role: teamMember.role, 
//       redirect: '/dashboard' // Or role-based redirect
//     });
//   } catch (error) {
//     console.error('Team login error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }
// /api/auth/team-login/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch team member by email
    const { data: teamMember, error } = await supabase
      .from('team_members')
      .select(`
        id,
        full_name,
        email,
        password_hash,
        status,
        role,
        provider_id
      `)
      .eq('email', email)
      .single();

    if (error || !teamMember) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if team member is active
    if (teamMember.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account is not active. Please check your email for activation link or contact your administrator.' },
        { status: 403 }
      );
    }

    // Check if password is set
    if (!teamMember.password_hash) {
      return NextResponse.json(
        { error: 'Password not set. Please use the setup link sent to your email.' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      teamMember.password_hash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Store team member session
    const cookieStore = await cookies();
    cookieStore.set(
      'team_member_session',
      JSON.stringify({
        id: teamMember.id,
        email: teamMember.email,
        name: teamMember.full_name,
        role: teamMember.role || 'Viewer', // Ensure role is set
        provider_id: teamMember.provider_id,
        type: 'team_member'
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user_type: 'team_member',
      role: teamMember.role || 'Viewer'
    });
  } catch (error) {
    console.error('Team login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}