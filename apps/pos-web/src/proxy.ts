import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/select-store'];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isPublicRoute = publicRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value ||
                request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    const host = request.headers.get('host') || 'localhost';
    const url = new URL('/login', `http://${host}`);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
