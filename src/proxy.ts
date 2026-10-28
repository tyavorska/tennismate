import { NextResponse, type NextRequest } from 'next/server';
import { protectedPaths, sessionCookieName } from '@/shared/config';

// Only checks that a cookie exists. getCurrentUser decides whether it is valid.
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  if (!isProtected || request.cookies.has(sessionCookieName)) return NextResponse.next();

  const signInUrl = new URL('/sign-in', request.nextUrl);
  signInUrl.searchParams.set('returnTo', `${pathname}${search}`);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
