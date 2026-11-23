import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 公开路由（无需登录验证）
const publicRoutes = [
  '/login',
  '/register',
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 检查是否是公开路由
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // 公开路由直接放行
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // 其他路由检查 token（只检查是否存在，不验证有效性）
  const token = request.cookies.get('token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '');
  
  // 如果没有 token，重定向到登录页
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // 有 token 则放行，由前端验证 token 有效性
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
