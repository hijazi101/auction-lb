// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;

  if (!token && !request.nextUrl.pathname.startsWith('/')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Apply middleware to all routes except signin and static files
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|signin).*)'],
};