// /api/team/members/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  
  // Get user role from headers
  const providerSession = cookieStore.get('provider_session');
  const teamSession = cookieStore.get('team_member_session');
  
  let providerId: string;
  let userRole = '';
  
  // Check provider session first
  if (providerSession?.value) {
    try {
      const session = JSON.parse(providerSession.value);
      providerId = session.id;
      userRole = 'Admin';
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
  } 
  // Check team member session
  else if (teamSession?.value) {
    try {
      const session = JSON.parse(teamSession.value);
      providerId = session.provider_id;
      userRole = session.role || 'Viewer';
      
      // Only Admin can view team members
      if (userRole !== 'Admin') {
        return NextResponse.json(
          { error: 'Unauthorized: Only Admins can view team members' },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('team_members')
    .select('id, full_name, email, role, status')
    .eq('provider_id', providerId)
    .neq('status', 'removed')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}