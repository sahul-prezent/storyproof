import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check for any Supabase auth cookie (including chunked cookies like sb-xxx-auth-token.0)
    const hasAuthCookie = request.cookies.getAll().some(
      c => c.name.startsWith('sb-') && c.name.includes('-auth-token')
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
