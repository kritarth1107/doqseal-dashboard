import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session_token');
  const { pathname } = request.nextUrl;

  // 1. Skip middleware for static assets, images, and internal Next.js routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Check if the current route is an authentication route
  const isAuthRoute = pathname.startsWith('/auth');

  // 3. Logic for authenticated users
  if (token) {
    // If user is logged in and tries to access /auth, redirect to dashboard
    if (isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // If user is on the root path, redirect to dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } 
  
  // 4. Logic for unauthenticated users
  else {
    // If user is NOT logged in and tries to access a protected route (non-auth), redirect to /auth
    if (!isAuthRoute) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  return NextResponse.next();
}

// 5. Apply middleware to all routes except explicitly excluded ones
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
