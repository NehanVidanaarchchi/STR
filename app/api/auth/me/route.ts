import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const providerSession = cookieStore.get('provider_session');
  const teamSession = cookieStore.get('team_member_session');

  if (providerSession?.value) {
    try {
      const session = JSON.parse(providerSession.value);
      return NextResponse.json({
        id: session.id,
        email: session.email,
        name: session.name,
         role: session.role ?? 'Admin',
        type: 'provider',
        isAuthenticated: true
      });
    } catch (error) {
      return NextResponse.json({
        isAuthenticated: false,
        error: 'Invalid session'
      }, { status: 401 });
    }
  }

  if (teamSession?.value) {
    try {
      const session = JSON.parse(teamSession.value);
      return NextResponse.json({
        id: session.id,
        email: session.email,
        name: session.name,
        role: session.role || 'Viewer',
        type: 'team_member',
        provider_id: session.provider_id,
        isAuthenticated: true
      });
    } catch (error) {
      return NextResponse.json({
        isAuthenticated: false,
        error: 'Invalid session'
      }, { status: 401 });
    }
  }

  return NextResponse.json({
    isAuthenticated: false,
    error: 'No session found'
  }, { status: 401 });
}