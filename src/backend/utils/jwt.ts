/**
 * JWT Token Utilities
 * Access token and refresh token generation and verification.
 */

import jwt, {
  JwtPayload,
  SignOptions,
  TokenExpiredError,
  JsonWebTokenError,
} from 'jsonwebtoken';
import { env } from '@/backend/config/env';
import type { JWTPayload } from '@/backend/types';

/**
 * Sign an access token.
 */
export function signAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const signOptions: SignOptions = {
    expiresIn: env.jwtAccessExpiry as SignOptions['expiresIn'],
    issuer: 'flipstore',
    audience: env.appUrl,
  };
  return jwt.sign(payload, env.jwtSecret, signOptions);
}

/**
 * Sign a refresh token.
 */
export function signRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const signOptions: SignOptions = {
    expiresIn: env.jwtRefreshExpiry as SignOptions['expiresIn'],
    issuer: 'flipstore',
    audience: env.appUrl,
  };
  return jwt.sign(payload, env.jwtRefreshSecret, signOptions);
}

/**
 * Verify an access token.
 * Returns the decoded payload or throws.
 */
export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, env.jwtSecret, {
    issuer: 'flipstore',
    audience: env.appUrl,
  }) as JWTPayload;
}

/**
 * Verify a refresh token.
 * Returns the decoded payload or throws.
 */
export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, env.jwtRefreshSecret, {
    issuer: 'flipstore',
    audience: env.appUrl,
  }) as JWTPayload;
}

/**
 * Extract token from Authorization header (Bearer scheme).
 * Returns null if header is missing or malformed.
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

/**
 * Check if an error is a JWT token expiration error.
 */
export function isTokenExpiredError(error: unknown): boolean {
  return error instanceof TokenExpiredError;
}

/**
 * Check if an error is a JWT malformed/invalid error.
 */
export function isTokenInvalidError(error: unknown): boolean {
  return error instanceof JsonWebTokenError;
}
