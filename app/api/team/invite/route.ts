// /api/team/invite/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateLoginToken } from '@/lib/tokens';
import { sendEmail } from '@/lib/email';
import { inviteTeamMemberTemplate } from '@/lib/emailTemplates';
import { cookies } from 'next/headers';

type SessionInfo = {
  providerId: string;
  role: "Admin" | "Editor" | "Viewer";
  userType: "provider" | "team_member";
  userId: string;
};

function getSession(cookieStore: Awaited<ReturnType<typeof cookies>>): SessionInfo | null {
  const providerSessionRaw = cookieStore.get("provider_session")?.value;
  const teamSessionRaw = cookieStore.get("team_member_session")?.value;

  // If both exist, clear and force re-login (prevents weird conflicts)
  if (providerSessionRaw && teamSessionRaw) return null;

  if (providerSessionRaw) {
    const s = JSON.parse(providerSessionRaw);
    if (!s?.id) return null;

    return {
      providerId: s.id,
      role: "Admin",
      userType: "provider",
      userId: s.id,
    };
  }

  if (teamSessionRaw) {
    const s = JSON.parse(teamSessionRaw);
    if (!s?.id || !s?.provider_id) return null;

    return {
      providerId: s.provider_id,
      role: (s.role || "Viewer") as SessionInfo["role"],
      userType: "team_member",
      userId: s.id,
    };
  }

  return null;
}

export async function POST(req: Request) {
  console.log('INVITE API HIT');
  const supabase = await createClient();

  // Get user role from headers (set by middleware)
  const userRole = req.headers.get('x-user-role');

  // Check if user has permission to invite members
  // Only Admin can invite members
  // if (userRole !== 'Admin') {
  //   return NextResponse.json(
  //     { error: 'Unauthorized: Only Admins can invite team members' },
  //     { status: 403 }
  //   );
  // }

  // Get current provider from session
  const cookieStore = await cookies();
  const session = getSession(cookieStore);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let providerId: string;
  try {
    // const s = JSON.parse(psession.providerId);
    providerId = session.providerId; // This should be the actual provider ID from login
    console.log('Provider ID from session:', providerId);
  } catch (error) {
    console.error('Session parse error:', error);
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const { fullName, email, role } = await req.json();
  console.log('Received data:', { fullName, email, role });

  if (!fullName || !email || !role) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Check if team member already exists with this email
  const { data: existingMember, error: checkError } = await supabase
    .from('team_members')
    .select('id')
    .eq('email', email)
    .eq('provider_id', providerId)
    .single();

  if (existingMember) {
    return NextResponse.json({
      error: 'A team member with this email already exists for your provider'
    }, { status: 400 });
  }

  // Create team member entry
  const { data: newMember, error: teamError } = await supabase
    .from('team_members')
    .insert({
      full_name: fullName,
      email,
      role,
      provider_id: providerId,
      status: 'invited', // Explicitly set status
    })
    .select()
    .single();

  if (teamError) {
    console.error('Error creating team member:', teamError);

    // Check if it's a foreign key constraint error
    if (teamError.code === '23503') {
      return NextResponse.json({
        error: 'Invalid provider ID. Please ensure you are logged in as a valid provider.'
      }, { status: 400 });
    }

    return NextResponse.json({
      error: `Failed to create team member: ${teamError.message}`
    }, { status: 500 });
  }

  console.log('Team member created:', newMember);

  // Token for password setup
  const { token, tokenHash } = generateLoginToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Check if token already exists for this email
  const { data: existingToken } = await supabase
    .from('password_setup_tokens')
    .select('id')
    .eq('email', email)
    .eq('used', false)
    .single();

  if (existingToken) {
    // Update existing token
    const { error: tokenUpdateError } = await supabase
      .from('password_setup_tokens')
      .update({
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', existingToken.id);

    if (tokenUpdateError) {
      console.error('Error updating token:', tokenUpdateError);
    }
  } else {
    // Create new token
    const { error: tokenError } = await supabase
      .from('password_setup_tokens')
      .insert({
        email,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (tokenError) {
      console.error('Error creating token:', tokenError);
      // Don't fail the request if token creation fails
    }
  }

  const setupLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/set-password?token=${token}`;
  console.log('Setup link created:', setupLink);

  // Email
  try {
    await sendEmail({
      to: email,
      subject: 'You are invited to STR Marketplace',
      html: inviteTeamMemberTemplate({ fullName, role, setupLink }),
    });
    console.log('Invitation email sent to:', email);
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    // Don't fail the request if email fails
  }

  return NextResponse.json({
    success: true,
    message: 'Team member invited successfully',
    data: newMember
  });
}