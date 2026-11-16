/**
 * Password Hashing Utilities
 * Uses bcryptjs for secure password hashing and comparison.
 * Never stores plain-text passwords.
 */

import bcrypt from 'bcryptjs';
import { env } from '@/backend/config/env';

const SALT_ROUNDS = env.bcryptSaltRounds;

/**
 * Hash a plain-text password.
 * Returns the hashed password string ready for storage.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a stored hash.
 * Returns true if the passwords match, false otherwise.
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Validate password strength.
 * Returns an object with isValid and an array of error messages.
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
