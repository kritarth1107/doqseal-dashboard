import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
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
    // Allow social login hook to finish; skip bounce for other /auth pages
    const isAuthHook = pathname.startsWith('/auth/hook');
    if (isAuthRoute && !isAuthHook) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Root → dashboard (onboarding gate handled client-side)
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } 
  
  // 4. Logic for unauthenticated users
  else {
    // Onboarding and app routes require a session
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
