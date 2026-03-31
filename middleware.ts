// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// export function middleware(request: NextRequest) {
//   const session = request.cookies.get('provider_session')

//   if (!session) {
//     return NextResponse.redirect(
//       new URL('/auth/login', request.url)
//     )
//   }

//   return NextResponse.next()
// }

// export const config = {
//   matcher: ['/dashboard/:path*'],
// }

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const providerSession = request.cookies.get('provider_session');
  const teamSession = request.cookies.get('team_member_session');
  
  const isProvider = providerSession?.value;
  const isTeamMember = teamSession?.value;
  
  // Public paths that don't require authentication
  const publicPaths = [
    '/auth/login',
    '/auth/set-password',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/api/auth',
    '/api/public',
    '/',
    '/about',
    '/contact',
    '/privacy',
    '/terms'
  ];
  
  // Check if current path is public
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(path)
  );
  
  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Check if user is authenticated
  if (!isProvider && !isTeamMember) {
    // Redirect to login if accessing protected routes
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // Parse session data
  let userType = '';
  let role = '';
  let userId = '';
  let userEmail = '';
  let userName = '';
  
  if (isProvider) {
    try {
      const session = JSON.parse(isProvider);
      userType = 'provider';
      role = 'Admin'; // Provider is always admin
      userId = session.id || '';
      userEmail = session.email || '';
      userName = session.name || '';
    } catch (e) {
      // Invalid session, clear it
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.delete('provider_session');
      return response;
    }
  }
  
  if (isTeamMember) {
    try {
      const session = JSON.parse(isTeamMember);
      userType = 'team_member';
      role = session.role || 'Viewer';
      userId = session.id || '';
      userEmail = session.email || '';
      userName = session.name || '';
      // Ensure provider_id exists for team members
      const providerId = session.provider_id || '';
      if (!providerId && userType === 'team_member') {
        // Invalid team member session
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        response.cookies.delete('team_member_session');
        return response;
      }
    } catch (e) {
      // Invalid session, clear it
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.delete('team_member_session');
      return response;
    }
  }
  
  // API-specific restrictions
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Check API access based on role
    const apiPath = request.nextUrl.pathname;
    
    // Admin-only APIs
    const adminOnlyAPIs = [
      '/api/team/invite',
      '/api/team/members',
      '/api/billing',
      '/api/settings/company'
    ];
    
    // Editor or higher APIs (no Viewer access)
    const editorOrHigherAPIs = [
      '/api/profile/update',
      '/api/products',
      '/api/integrations'
    ];
    
    // Check admin-only APIs
    if (adminOnlyAPIs.some(api => apiPath.startsWith(api))) {
      if (role !== 'Admin') {
        return NextResponse.json(
          { error: 'Unauthorized: Admin access required' },
          { status: 403 }
        );
      }
    }
    
    // Check editor-or-higher APIs
    if (editorOrHigherAPIs.some(api => apiPath.startsWith(api))) {
      if (role === 'Viewer') {
        return NextResponse.json(
          { error: 'Unauthorized: Editor or Admin access required' },
          { status: 403 }
        );
      }
    }
    
    // Special case: team members can only access their own provider's data
    if (userType === 'team_member' && apiPath.includes('/api/team/')) {
      // This will be handled in individual API routes by checking provider_id
      // We'll pass the user info for the API to use
    }
  }
  
  // Page-specific restrictions
  if (request.nextUrl.pathname.startsWith('/settings')) {
    // Admin-only pages
    const adminOnlyPages = [
      '/settings/team',
      '/settings/billing',
      '/settings/company'
    ];
    
    // Editor or higher pages (no Viewer access)
    const editorOrHigherPages = [
      '/settings/profile',
      '/settings/products',
      '/settings/integrations'
    ];
    
    // Check admin-only pages
    if (adminOnlyPages.some(page => request.nextUrl.pathname.startsWith(page))) {
      if (role !== 'Admin') {
        return NextResponse.redirect(new URL('/settings', request.url));
      }
    }
    
    // Check editor-or-higher pages
    if (editorOrHigherPages.some(page => request.nextUrl.pathname.startsWith(page))) {
      if (role === 'Viewer') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // Special case: main settings page
    if (request.nextUrl.pathname === '/settings') {
      if (role === 'Viewer') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }
  
  // Dashboard access control
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Check if team member has access to specific dashboard sections
    const dashboardSubPaths = [
      '/dashboard/admin', // Admin only
      '/dashboard/analytics', // Admin & Editor
      '/dashboard/reports' // Admin & Editor
    ];
    
    // Admin-only dashboard sections
    if (request.nextUrl.pathname.startsWith('/dashboard/admin')) {
      if (role !== 'Admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // Analytics and reports for Admin & Editor only
    if (request.nextUrl.pathname.startsWith('/dashboard/analytics') || 
        request.nextUrl.pathname.startsWith('/dashboard/reports')) {
      if (role === 'Viewer') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }
  
  // Add user info to request headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', userId);
  requestHeaders.set('x-user-email', userEmail);
  requestHeaders.set('x-user-name', userName);
  requestHeaders.set('x-user-role', role);
  requestHeaders.set('x-user-type', userType);
  
  // For team members, also add provider_id if available
  if (isTeamMember) {
    try {
      const session = JSON.parse(isTeamMember);
      if (session.provider_id) {
        requestHeaders.set('x-provider-id', session.provider_id);
      }
    } catch (e) {
      // Ignore if can't parse
    }
  }
  
  // For providers, the provider_id is the user id
  if (isProvider) {
    requestHeaders.set('x-provider-id', userId);
  }
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - Public API routes (handled by publicPaths check)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};