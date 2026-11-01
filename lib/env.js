/**
 * Environment variables validation and inspection helper.
 * Provides safe verification of server configuration without crashing at build time.
 */

export function checkEnvStatus() {
  const vars = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: !!process.env.ADMIN_PASSWORD_HASH,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
  };

  const missing = Object.entries(vars)
    .filter(([_, isSet]) => !isSet)
    .map(([key]) => key);

  return {
    isConfigured: missing.length === 0,
    missing,
    status: vars,
  };
}

export function validateRequiredEnv(keys = []) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
