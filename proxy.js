import { NextResponse } from 'next/server.js';
import { jwtVerify } from 'jose/jwt/verify';

const SESSION_COOKIE_NAME = 'ml_admin_session';

async function verifyToken(token) {
  if (!token) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  try {
    const encodedSecret = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifyToken(token);
  const isAuthenticated = !!session;

  // 1. Root /admin path: redirect directly to /admin/rooms or /admin/login
  if (pathname === '/admin') {
    const targetUrl = new URL(request.nextUrl);
    targetUrl.pathname = isAuthenticated ? '/admin/rooms' : '/admin/login';
    return NextResponse.redirect(targetUrl);
  }

  // 2. /admin/login: if already authenticated, redirect to /admin/rooms
  if (pathname === '/admin/login') {
    if (isAuthenticated) {
      const targetUrl = new URL(request.nextUrl);
      targetUrl.pathname = '/admin/rooms';
      return NextResponse.redirect(targetUrl);
    }
    return NextResponse.next();
  }

  // 3. Protected /admin pages: require authentication
  if (pathname.startsWith('/admin/')) {
    if (!isAuthenticated) {
      const loginUrl = new URL(request.nextUrl);
      loginUrl.pathname = '/admin/login';
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 4. Protected /api/admin routes (except /api/admin/auth/login)
  if (pathname.startsWith('/api/admin/')) {
    if (pathname === '/api/admin/auth/login') {
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid admin session required.' },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};
