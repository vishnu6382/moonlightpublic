import { SignJWT } from 'jose';
import { jwtVerify } from 'jose/jwt/verify';
import bcrypt from 'bcryptjs';

export const SESSION_COOKIE_NAME = 'ml_admin_session';
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Returns the secret key encoded for jose JWT signing and verification.
 */
function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be defined and at least 32 characters long.');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Signs a JWT session token for the authenticated admin.
 */
export async function signSessionToken(payload = {}) {
  const secret = getSecretKey();
  return await new SignJWT({
    email: payload.email,
    role: 'admin',
    ...payload,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
}

/**
 * Verifies and decodes a JWT session token.
 * Returns payload on success, or null if invalid/expired.
 */
export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Validates admin credentials against environment variables.
 * Uses bcrypt compare against ADMIN_PASSWORD_HASH with safe fallback.
 * Never logs credentials.
 */
export async function verifyAdminCredentials(email, password) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  const adminPlain = process.env.ADMIN_PASSWORD;

  if (!adminEmail || (!adminHash && !adminPlain)) {
    console.error('[Auth Error] ADMIN_EMAIL or password configuration is missing.');
    return false;
  }

  // Case-insensitive comparison for email
  const emailMatch =
    typeof email === 'string' &&
    email.trim().toLowerCase() === adminEmail.trim().toLowerCase();

  if (!emailMatch) {
    return false;
  }

  if (typeof password !== 'string' || !password) {
    return false;
  }

  // 1. Primary: Verify against bcrypt password hash
  if (adminHash && adminHash.startsWith('$2')) {
    try {
      const isHashValid = await bcrypt.compare(password, adminHash);
      if (isHashValid) return true;
    } catch (e) {
      // Hash comparison error
    }
  }

  // 2. Fallback: If hash was corrupted by dotenv expansion or plain password configured
  if (adminPlain && password === adminPlain) {
    return true;
  }

  return false;
}

/**
 * Cookie options for the admin session token.
 */
export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  };
}
