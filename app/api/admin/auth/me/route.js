import { NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { authenticated: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const payload = await verifySessionToken(token);

  if (!payload) {
    return NextResponse.json(
      { authenticated: false, error: 'Session expired or invalid' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: payload.email,
      role: payload.role || 'admin',
    },
  });
}
