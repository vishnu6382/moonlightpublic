import fs from 'fs';
import path from 'path';

// Load .env.local if not already in process.env
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

async function runTests() {
  console.log('--- STARTING AUTHENTICATION & LOCKOUT TESTS ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Password Verification Test
    console.log('1. Testing Password Verification with Bcrypt:');
    const validPass = process.env.ADMIN_PASSWORD || 'test-password';
    const invalidPass = 'WrongPassword123!';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@moonlightresort.com';

    const isValid = await verifyAdminCredentials(adminEmail, validPass);
    assert(isValid === true, 'Correct password verifies successfully against ADMIN_PASSWORD_HASH');

    const isInvalid = await verifyAdminCredentials(adminEmail, invalidPass);
    assert(isInvalid === false, 'Wrong password is rejected');

    const isWrongEmail = await verifyAdminCredentials('attacker@bad.com', validPass);
    assert(isWrongEmail === false, 'Wrong email with correct password is rejected');

    // 2. JWT Session Signing & Verification Test
    console.log('\n2. Testing JWT Session Token Signing & Verification:');
    const token = await signSessionToken({ email: adminEmail });
    assert(typeof token === 'string' && token.length > 20, 'JWT token signed successfully');

    const decoded = await verifySessionToken(token);
    assert(decoded && decoded.email === adminEmail && decoded.role === 'admin', 'JWT token decoded and verified successfully');

    const fakeDecoded = await verifySessionToken('invalid.token.string');
    assert(fakeDecoded === null, 'Tampered/invalid JWT returns null');

    // 3. Persistent 5-Attempt & 15-Minute Lockout Tests
    console.log('\n3. Testing 5-Failed-Attempts & 15-Minute Lockout:');
    const testKey = `test_rate_limit_${Date.now()}`;

    // Clean any prior test record
    await resetAdminRateLimit(testKey);

    // Initial check: should not be locked
    let rateCheck = await checkAdminRateLimit(testKey);
    assert(rateCheck.isLocked === false && rateCheck.remainingAttempts === 5, 'Initial state: Not locked, 5 attempts remaining');

    // Simulate attempts 1 to 4
    for (let i = 1; i <= 4; i++) {
      const res = await recordFailedAdminLogin(testKey);
      assert(res.attempts === i && res.isLocked === false, `Attempt ${i}: Recorded, not locked (remaining: ${5 - i})`);
    }

    // 5th failed attempt: MUST trigger lockout
    const res5 = await recordFailedAdminLogin(testKey);
    assert(res5.attempts === 5 && res5.isLocked === true && res5.lockedUntil instanceof Date, 'Attempt 5: Lockout triggered! lockedUntil is set');

    // Attempt 6 while locked: checkAdminRateLimit MUST report locked
    rateCheck = await checkAdminRateLimit(testKey);
    assert(rateCheck.isLocked === true && rateCheck.waitMinutes > 0, `Locked state confirmed: waitMinutes=${rateCheck.waitMinutes}`);

    // Test lockout expiration behavior
    console.log('\n4. Testing Lockout Expiry Simulation:');
    await simulateExpireLockout(testKey);

    const expiredCheck = await checkAdminRateLimit(testKey);
    assert(expiredCheck.isLocked === false && expiredCheck.remainingAttempts === 5, 'After lockout expiration: Lock is lifted, attempts reset to 5');

    // Clean up test key
    await resetAdminRateLimit(testKey);
    console.log('Test rate limit cleanup complete.');

  } catch (err) {
    console.error('Test suite error:', err);
    failed++;
  }

  console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests();
