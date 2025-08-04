import { NextResponse } from 'next/server';

export function middleware() {
  // For now, just pass through all requests
  // TODO: Add authentication middleware here
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};