import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const providerSession = cookieStore.get('provider_session');
  const teamSession = cookieStore.get('team_member_session');

  const sessionData = providerSession?.value || teamSession?.value;

  if (!sessionData) {
    redirect('/auth/login');
  }

  try {
    const user = JSON.parse(sessionData);
    return <DashboardClient user={user} />;
  } catch (error) {
    redirect('/auth/login');
  }
}