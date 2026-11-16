/**
 * Rate Limiting Middleware
 * Simple in-memory rate limiter for sensitive auth endpoints.
 * Tracks requests by IP address and limits the number of requests per window.
 * 
 * ⚠️  This is an in-memory store. For production with multiple server instances,
 *    replace with Redis or a distributed store.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/backend/utils/response';
import { HTTP_STATUS } from '@/backend/constants';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store: key = IP address, value = rate limit entry
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limiter options.
 */
interface RateLimitOptions {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  message?: string;      // Custom error message
}

/**
 * Clean up expired entries from the store.
 */
function cleanupStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limiter middleware factory.
 * 
 * Usage: 
 *   export const POST = rateLimit({ windowMs: 60 * 1000, maxRequests: 5 })(
 *     withDatabase(async (req) => { ... })
 *   );
 */
export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, message = 'Too many requests. Please try again later.' } = options;

  return function (
    handler: (req: NextRequest) => Promise<NextResponse>,
  ) {
    return async (req: NextRequest): Promise<NextResponse> => {
      // Clean up expired entries periodically
      cleanupStore();

      // Get client IP from headers (supports proxy/load balancer)
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';

      const now = Date.now();
      const entry = rateLimitStore.get(ip);

      if (!entry || now > entry.resetTime) {
        // First request or window expired - start new window
        rateLimitStore.set(ip, {
          count: 1,
          resetTime: now + windowMs,
        });
        return handler(req);
      }

      if (entry.count >= maxRequests) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        const headers = new Headers();
        headers.set('Retry-After', retryAfter.toString());
        headers.set('X-RateLimit-Limit', maxRequests.toString());
        headers.set('X-RateLimit-Remaining', '0');
        headers.set('X-RateLimit-Reset', entry.resetTime.toString());

        return NextResponse.json(
          createErrorResponse(message, {
            statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
            code: 'RATE_LIMIT_EXCEEDED',
            details: { retryAfter: [`${retryAfter}s`] },
          }),
          {
            status: HTTP_STATUS.TOO_MANY_REQUESTS,
            headers,
          },
        );
      }

      // Increment counter and proceed
      entry.count++;
      return handler(req);
    };
  };
}

/**
 * Pre-configured rate limiters for common auth endpoints.
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,      // 5 requests per minute
  message: 'Too many authentication attempts. Please try again later.',
});

export const sensitiveAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 3,           // 3 requests per 15 minutes
  message: 'Too many attempts. Please try again after 15 minutes.',
});

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,     // 60 requests per minute
});
