/**
 * Environment Variable Validation
 * Lazy per-variable access to avoid throwing during Next.js build
 * when .env.local may not yet be present.
 */

function getRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Please check .env.example and create .env.local with all required values.`,
    );
  }
  return value;
}

function getOptional(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

function getOptionalNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

const getters: Record<string, () => unknown> = {
  port: () => getOptionalNumber('PORT', 3000),
  nodeEnv: () => getOptional('NODE_ENV', 'development'),
  appUrl: () => getOptional('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  mongodbUri: () => getRequired('MONGODB_URI'),
  mongodbDbName: () => getOptional('MONGODB_DB_NAME', 'flipstore'),
  jwtSecret: () => getRequired('JWT_SECRET'),
  jwtRefreshSecret: () => getRequired('JWT_REFRESH_SECRET'),
  jwtAccessExpiry: () => getOptional('JWT_ACCESS_EXPIRY', '15m'),
  jwtRefreshExpiry: () => getOptional('JWT_REFRESH_EXPIRY', '7d'),
  cloudinaryCloudName: () => getOptional('CLOUDINARY_CLOUD_NAME', ''),
  cloudinaryApiKey: () => getOptional('CLOUDINARY_API_KEY', ''),
  cloudinaryApiSecret: () => getOptional('CLOUDINARY_API_SECRET', ''),
  razorpayKeyId: () => getOptional('RAZORPAY_KEY_ID', ''),
  razorpayKeySecret: () => getOptional('RAZORPAY_KEY_SECRET', ''),
  razorpayWebhookSecret: () => getOptional('RAZORPAY_WEBHOOK_SECRET', ''),
  publicRazorpayKeyId: () => getOptional('NEXT_PUBLIC_RAZORPAY_KEY_ID', ''),
  bcryptSaltRounds: () => getOptionalNumber('BCRYPT_SALT_ROUNDS', 12),
  cookieSameSite: () => (getOptional('COOKIE_SAME_SITE', 'lax') as 'lax' | 'strict' | 'none'),
  cookieSecure: () => getOptional('COOKIE_SECURE', 'false') === 'true',
  cookieDomain: () => getOptional('COOKIE_DOMAIN', '') || undefined,
  corsOrigins: () => getOptional('CORS_ALLOWED_ORIGINS', 'http://localhost:3000'),
  logLevel: () => getOptional('LOG_LEVEL', 'info'),
  rateLimitWindowMs: () => getOptionalNumber('RATE_LIMIT_WINDOW_MS', 60000),
  rateLimitMax: () => getOptionalNumber('RATE_LIMIT_MAX_REQUESTS', 120),
  notificationEmailProvider: () => getOptional('NOTIFICATION_EMAIL_PROVIDER', ''),
  notificationEmailFrom: () => getOptional('NOTIFICATION_EMAIL_FROM', ''),
  notificationEmailApiKey: () => getOptional('NOTIFICATION_EMAIL_API_KEY', ''),
  notificationSmsProvider: () => getOptional('NOTIFICATION_SMS_PROVIDER', ''),
  notificationSmsFrom: () => getOptional('NOTIFICATION_SMS_FROM', ''),
  notificationSmsApiKey: () => getOptional('NOTIFICATION_SMS_API_KEY', ''),
};

type EnvShape = {
  port: number;
  nodeEnv: string;
  appUrl: string;
  mongodbUri: string;
  mongodbDbName: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiry: string;
  jwtRefreshExpiry: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret: string;
  publicRazorpayKeyId: string;
  bcryptSaltRounds: number;
  cookieSameSite: 'lax' | 'strict' | 'none';
  cookieSecure: boolean;
  cookieDomain: string | undefined;
  corsOrigins: string;
  logLevel: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  notificationEmailProvider: string;
  notificationEmailFrom: string;
  notificationEmailApiKey: string;
  notificationSmsProvider: string;
  notificationSmsFrom: string;
  notificationSmsApiKey: string;
};

export const env = new Proxy({} as EnvShape, {
  get(_, prop: keyof EnvShape) {
    return getters[prop as keyof typeof getters]();
  },
}) as EnvShape;

export function validateEnv(): void {
  getRequired('MONGODB_URI');
  getRequired('JWT_SECRET');
  getRequired('JWT_REFRESH_SECRET');
  const jwtSecret = getters.jwtSecret() as string;
  const jwtRefreshSecret = getters.jwtRefreshSecret() as string;
  const bcryptSaltRounds = getters.bcryptSaltRounds() as number;
  if (jwtSecret.length < 16) throw new Error('JWT_SECRET must be at least 16 characters long.');
  if (jwtRefreshSecret.length < 16) throw new Error('JWT_REFRESH_SECRET must be at least 16 characters long.');
  if (bcryptSaltRounds < 8 || bcryptSaltRounds > 16) throw new Error('BCRYPT_SALT_ROUNDS must be between 8 and 16.');
}
