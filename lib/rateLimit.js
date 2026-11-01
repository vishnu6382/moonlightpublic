import connectDB from './db.js';
import AdminRateLimit from '../models/AdminRateLimit.js';

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Resilient in-memory fallback store if database is momentarily unreachable
const memoryFallbackStore = new Map();

/**
 * Checks whether an IP/identifier is currently locked out.
 * Programmatically checks lockedUntil timestamp — does not rely solely on MongoDB TTL.
 */
export async function checkAdminRateLimit(key) {
  const now = new Date();

  try {
    await connectDB();
    const record = await AdminRateLimit.findOne({ key });

    if (!record) {
      return { isLocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS };
    }

    if (record.lockedUntil) {
      if (record.lockedUntil > now) {
        const waitMinutes = Math.ceil((record.lockedUntil.getTime() - now.getTime()) / 60000);
        return {
          isLocked: true,
          waitMinutes,
          lockedUntil: record.lockedUntil,
          remainingAttempts: 0,
        };
      } else {
        // Lock has expired; reset attempts
        record.attempts = 0;
        record.lockedUntil = null;
        await record.save();
        return { isLocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS };
      }
    }

    const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS - (record.attempts || 0));
    return { isLocked: false, remainingAttempts: remaining };
  } catch (dbError) {
    console.warn('[RateLimit] Database connection issue, using resilient memory fallback:', dbError.message);
    const mem = memoryFallbackStore.get(key);
    if (!mem) {
      return { isLocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS };
    }
    if (mem.lockedUntil) {
      if (mem.lockedUntil > now) {
        const waitMinutes = Math.ceil((mem.lockedUntil.getTime() - now.getTime()) / 60000);
        return {
          isLocked: true,
          waitMinutes,
          lockedUntil: mem.lockedUntil,
          remainingAttempts: 0,
        };
      } else {
        mem.attempts = 0;
        mem.lockedUntil = null;
        return { isLocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS };
      }
    }
    const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS - (mem.attempts || 0));
    return { isLocked: false, remainingAttempts: remaining };
  }
}

/**
 * Records a failed login attempt and triggers 15-minute lock upon 5 failed attempts.
 */
export async function recordFailedAdminLogin(key) {
  const now = new Date();

  try {
    await connectDB();
    let record = await AdminRateLimit.findOne({ key });

    if (!record) {
      record = new AdminRateLimit({ key, attempts: 1 });
    } else {
      if (record.lockedUntil && record.lockedUntil <= now) {
        record.attempts = 1;
        record.lockedUntil = null;
      } else {
        record.attempts = (record.attempts || 0) + 1;
      }
    }

    if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
      record.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
    }

    await record.save();

    return {
      attempts: record.attempts,
      isLocked: record.attempts >= MAX_LOGIN_ATTEMPTS,
      lockedUntil: record.lockedUntil,
      remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - record.attempts),
    };
  } catch (dbError) {
    console.warn('[RateLimit] Database connection issue, recording attempt in memory fallback:', dbError.message);
    let mem = memoryFallbackStore.get(key) || { attempts: 0, lockedUntil: null };

    if (mem.lockedUntil && mem.lockedUntil <= now) {
      mem.attempts = 1;
      mem.lockedUntil = null;
    } else {
      mem.attempts = (mem.attempts || 0) + 1;
    }

    if (mem.attempts >= MAX_LOGIN_ATTEMPTS) {
      mem.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
    }

    memoryFallbackStore.set(key, mem);

    return {
      attempts: mem.attempts,
      isLocked: mem.attempts >= MAX_LOGIN_ATTEMPTS,
      lockedUntil: mem.lockedUntil,
      remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - mem.attempts),
    };
  }
}

/**
 * Clears rate limiting on successful login.
 */
export async function resetAdminRateLimit(key) {
  try {
    await connectDB();
    await AdminRateLimit.deleteOne({ key });
  } catch (dbError) {
    // Ignore db error on reset
  }
  memoryFallbackStore.delete(key);
}

/**
 * Helper to force-expire lockout in test environments.
 */
export async function simulateExpireLockout(key) {
  const expiredTime = new Date(Date.now() - 60000);
  try {
    await connectDB();
    await AdminRateLimit.updateOne(
      { key },
      { lockedUntil: expiredTime }
    );
  } catch (e) {
    // Database unreachable
  }
  const mem = memoryFallbackStore.get(key);
  if (mem) {
    mem.lockedUntil = expiredTime;
    memoryFallbackStore.set(key, mem);
  }
}
