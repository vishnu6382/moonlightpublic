import { NextResponse } from 'next/server';
import {
  verifyAdminCredentials,
  signSessionToken,
  getSessionCookieOptions,
} from '@/lib/auth';
import {
  checkAdminRateLimit,
  recordFailedAdminLogin,
  resetAdminRateLimit,
} from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rateLimitKey = `admin_login:${ip}`;

    // 1. Check if IP is currently locked out
    const rateCheck = await checkAdminRateLimit(rateLimitKey);
    if (rateCheck.isLocked) {
      return NextResponse.json(
        {
          error: `Account is temporarily locked due to 5 failed attempts. Please try again in ${rateCheck.waitMinutes} minute${rateCheck.waitMinutes === 1 ? '' : 's'}.`,
          isLocked: true,
          waitMinutes: rateCheck.waitMinutes,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // 2. Verify credentials
    const isValid = await verifyAdminCredentials(email, password);

    if (!isValid) {
      const record = await recordFailedAdminLogin(rateLimitKey);
      if (record.isLocked) {
        return NextResponse.json(
          {
            error: 'Account is temporarily locked due to 5 failed attempts. Please try again in 15 minutes.',
            isLocked: true,
            waitMinutes: 15,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: 'Invalid email or password.',
          remainingAttempts: record.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 3. Successful login: clear failed attempts
    await resetAdminRateLimit(rateLimitKey);

    // 4. Create signed session token and cookie
    const token = await signSessionToken({
      email: email.trim().toLowerCase(),
    });

    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json({
      success: true,
      user: {
        email: email.trim().toLowerCase(),
        role: 'admin',
      },
    });

    response.cookies.set(cookieOptions.name, token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (error) {
    console.error('[Login API Error]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}
