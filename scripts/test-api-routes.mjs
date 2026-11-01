import fs from 'fs';
import path from 'path';

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

import { verifyAdminCredentials, signSessionToken, verifySessionToken } from '../lib/auth.js';
import {
  checkAdminRateLimit,
  recordFailedAdminLogin,
  resetAdminRateLimit,
  simulateExpireLockout,
} from '../lib/rateLimit.js';
import { proxy } from '../proxy.js';

async function runAllTests() {
  console.log('====================================================');
  console.log('   MOON LIGHT RESORT — TASK 2 VERIFICATION SUITE   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  const testIp = '10.0.0.42';
  const rateLimitKey = `admin_login:${testIp}`;
  await resetAdminRateLimit(rateLimitKey);

  // ----------------------------------------------------
  // TEST GROUP 1: BCRYPT PASSWORD VERIFICATION
  // ----------------------------------------------------
  console.log('--- TEST GROUP 1: BCRYPT PASSWORD AUTHENTICATION ---');
  const validPass = process.env.ADMIN_PASSWORD || 'test-password';
  const wrongPass = 'IncorrectPass999';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@moonlightresort.com';

  const validResult = await verifyAdminCredentials(adminEmail, validPass);
  assert(validResult === true, 'Bcrypt correctly verifies valid password against ADMIN_PASSWORD_HASH');

  const invalidResult = await verifyAdminCredentials(adminEmail, wrongPass);
  assert(invalidResult === false, 'Bcrypt rejects incorrect password');

  const invalidEmailResult = await verifyAdminCredentials('attacker@unknown.com', validPass);
  assert(invalidEmailResult === false, 'Rejects unauthorized email with correct password');

  const emptyResult = await verifyAdminCredentials('', '');
  assert(emptyResult === false, 'Rejects empty credentials');

  // ----------------------------------------------------
  // TEST GROUP 2: JWT SIGNING, VERIFICATION & TAMPER PROOF
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 2: SESSION TOKEN (JWT) SECURITY ---');
  const token = await signSessionToken({ email: adminEmail });
  assert(typeof token === 'string' && token.length > 20, 'Generates valid signed JWT session token');

  const payload = await verifySessionToken(token);
  assert(payload && payload.email === adminEmail && payload.role === 'admin', 'Decodes valid token with correct admin claims');

  const tamperedToken = token.slice(0, -6) + 'abcdef';
  const tamperedResult = await verifySessionToken(tamperedToken);
  assert(tamperedResult === null, 'Rejects tampered signature');

  const nullResult = await verifySessionToken(null);
  assert(nullResult === null, 'Rejects null/missing token');

  // ----------------------------------------------------
  // TEST GROUP 3: 5-ATTEMPT / 15-MINUTE LOCKOUT ENFORCEMENT
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 3: 5-ATTEMPT / 15-MINUTE LOCKOUT ---');
  await resetAdminRateLimit(rateLimitKey);

  let initialCheck = await checkAdminRateLimit(rateLimitKey);
  assert(initialCheck.isLocked === false && initialCheck.remainingAttempts === 5, 'Clean state: 5 remaining attempts');

  // Attempts 1 to 4
  for (let i = 1; i <= 4; i++) {
    const attempt = await recordFailedAdminLogin(rateLimitKey);
    assert(attempt.attempts === i && attempt.isLocked === false, `Attempt ${i}: Recorded, not locked (remaining: ${5 - i})`);
  }

  // 5th attempt: MUST trigger lockout
  const attempt5 = await recordFailedAdminLogin(rateLimitKey);
  assert(attempt5.attempts === 5 && attempt5.isLocked === true && attempt5.lockedUntil instanceof Date, 'Attempt 5: 15-minute lockout triggered');

  // Attempt 6: MUST reject while locked out
  const checkWhileLocked = await checkAdminRateLimit(rateLimitKey);
  assert(checkWhileLocked.isLocked === true && checkWhileLocked.waitMinutes > 0, `Lockout enforced: waitMinutes=${checkWhileLocked.waitMinutes}`);

  // Test lockout expiration: simulate time passage
  console.log('\n--- TEST GROUP 4: LOCKOUT EXPIRATION BEHAVIOR ---');
  await simulateExpireLockout(rateLimitKey);
  const checkAfterExpiry = await checkAdminRateLimit(rateLimitKey);
  assert(checkAfterExpiry.isLocked === false && checkAfterExpiry.remainingAttempts === 5, 'After 15-min lockout expires: Lock is lifted, attempts reset to 5');

  // Cleanup
  await resetAdminRateLimit(rateLimitKey);

  // ----------------------------------------------------
  // TEST GROUP 5: MIDDLEWARE ROUTE PROTECTION
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 5: MIDDLEWARE ROUTE & API PROTECTION ---');

  // Helper to create mock NextRequest for middleware
  function createMockRequest(pathname, cookieToken = null) {
    const url = new URL(`http://localhost:3000${pathname}`);
    return {
      nextUrl: url,
      cookies: {
        get: (name) => (name === 'ml_admin_session' && cookieToken ? { value: cookieToken } : undefined),
      },
    };
  }

  // A. Unauthenticated visit to /admin -> should redirect to /admin/login
  const mwAdminUnauth = await proxy(createMockRequest('/admin'));
  assert(
    mwAdminUnauth?.headers?.get('location')?.includes('/admin/login'),
    'Unauthenticated /admin redirects to /admin/login'
  );

  // B. Unauthenticated visit to /admin/rooms -> should redirect to /admin/login
  const mwRoomsUnauth = await proxy(createMockRequest('/admin/rooms'));
  assert(
    mwRoomsUnauth?.headers?.get('location')?.includes('/admin/login'),
    'Unauthenticated /admin/rooms redirects to /admin/login'
  );

  // C. Unauthenticated call to /api/admin/media -> should return 401 Unauthorized
  const mwApiUnauth = await proxy(createMockRequest('/api/admin/media'));
  assert(mwApiUnauth?.status === 401, 'Unauthenticated /api/admin/* returns HTTP 401');

  // D. Authenticated visit to /admin/login -> should redirect directly to /admin/rooms
  const mwLoginAuth = await proxy(createMockRequest('/admin/login', token));
  assert(
    mwLoginAuth?.headers?.get('location')?.includes('/admin/rooms'),
    'Authenticated visitor on /admin/login redirects directly to /admin/rooms'
  );

  // E. Authenticated visit to /admin/rooms -> allowed through (no redirect)
  const mwRoomsAuth = await proxy(createMockRequest('/admin/rooms', token));
  assert(!mwRoomsAuth?.headers?.get('location'), 'Authenticated visitor on /admin/rooms is allowed through');

  // F. Public API /api/admin/auth/login -> allowed without session
  const mwLoginApi = await proxy(createMockRequest('/api/admin/auth/login'));
  assert(!mwLoginApi?.headers?.get('location') && mwLoginApi?.status !== 401, '/api/admin/auth/login is accessible without session');

  console.log('\n====================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runAllTests().catch((e) => {
  console.error('Fatal error during verification:', e);
  process.exit(1);
});
