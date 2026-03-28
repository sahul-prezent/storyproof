import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Protect /admin routes — redirect to login if no auth cookie
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const hasAuthCookie = request.cookies.getAll().some(
      c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    );

    if (!hasAuthCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
