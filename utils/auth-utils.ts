// utils/auth-utils.ts
import { cookies } from 'next/headers';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role?: string;
  type: 'provider' | 'team_member';
  provider_id?: string; // For team members
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  
  // Check provider session first
  const providerSession = cookieStore.get('provider_session')?.value;
  if (providerSession) {
    try {
      const session = JSON.parse(providerSession);
      return {
        id: session.id,
        email: session.email,
        name: session.name,
        role: 'Admin',
        type: 'provider'
      };
    } catch (error) {
      console.error('Error parsing provider session:', error);
      return null;
    }
  }
  
  // Check team member session
  const teamSession = cookieStore.get('team_member_session')?.value;
  if (teamSession) {
    try {
      const session = JSON.parse(teamSession);
      return {
        id: session.id,
        email: session.email,
        name: session.name,
        role: session.role || 'Viewer',
        type: 'team_member',
        provider_id: session.provider_id
      };
    } catch (error) {
      console.error('Error parsing team session:', error);
      return null;
    }
  }
  
  return null;
}

export async function checkPermission(requiredRole: 'Viewer' | 'Editor' | 'Admin'): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  const roleHierarchy = {
    'Viewer': 1,
    'Editor': 2,
    'Admin': 3
  };
  
  const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole];
  
  return userRoleLevel >= requiredRoleLevel;
}

export async function requirePermission(requiredRole: 'Viewer' | 'Editor' | 'Admin') {
  const hasPermission = await checkPermission(requiredRole);
  if (!hasPermission) {
    throw new Error(`Unauthorized: ${requiredRole} access required`);
  }
}