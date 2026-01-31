import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// Public routes that don't require authentication
const publicRoutes = new Set(['/login', '/']);

// Role-based route access
const roleRoutes: Record<string, string[]> = {
  SuperAdmin: ['/admin', '/users', '/settings', '/dashboard'],
  Admin: ['/users', '/settings', '/dashboard'],
  AdmissionStaff: ['/students', '/dashboard'],
  DocumentOfficer: ['/documents', '/students', '/dashboard'],
  AccountsOfficer: ['/fees', '/students', '/dashboard'],
  Principal: ['/dashboard', '/reports'],
  Director: ['/dashboard', '/reports', '/audit'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.has(pathname)) {
    return NextResponse.next();
  }

  // Allow static files and API routes (handle auth in API separately)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check role-based access
    const userRole = payload.role;
    const allowedRoutes = roleRoutes[userRole] || [];
    
    const hasAccess = allowedRoutes.some(route => pathname.startsWith(route));
    
    if (!hasAccess && pathname !== '/unauthorized') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware auth error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
