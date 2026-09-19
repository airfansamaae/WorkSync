/**
 * Security & Protection Utilities
 * Provides input sanitization (XSS prevention), rate limiting for login attempts,
 * password strength validation, and secure session management.
 */

// Rate limiter for brute force protection
const LOGIN_ATTEMPTS_KEY = 'ACADEMIC_SECURITY_LOGIN_ATTEMPTS';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

interface LoginAttemptRecord {
  attempts: number;
  lockedUntil: number | null;
}

export const SecurityService = {
  /**
   * Sanitizes string to prevent XSS attacks when stored or rendered
   */
  sanitizeInput(input: string): string {
    if (!input) return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * Strips dangerous script tags and harmful patterns
   */
  cleanText(text: string): string {
    if (!text) return '';
    return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
  },

  /**
   * Validate password security rules
   * At least 6 characters
   */
  validatePassword(password: string): { isValid: boolean; message?: string } {
    if (!password) {
      return { isValid: false, message: 'กรุณากรอกรหัสผ่าน' };
    }
    if (password.length < 6) {
      return { isValid: false, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรเพื่อความปลอดภัย' };
    }
    return { isValid: true };
  },

  /**
   * Check if username / IP is currently locked out due to excessive failed attempts
   */
  checkLoginRateLimit(identifier: string = 'global'): { isLocked: boolean; remainingMinutes: number } {
    try {
      const recordsRaw = sessionStorage.getItem(LOGIN_ATTEMPTS_KEY);
      const records: Record<string, LoginAttemptRecord> = recordsRaw ? JSON.parse(recordsRaw) : {};
      const record = records[identifier.toLowerCase()];

      if (!record || !record.lockedUntil) {
        return { isLocked: false, remainingMinutes: 0 };
      }

      const now = Date.now();
      if (now < record.lockedUntil) {
        const remainingMinutes = Math.ceil((record.lockedUntil - now) / (60 * 1000));
        return { isLocked: true, remainingMinutes };
      }

      // Lock expired, reset record
      delete records[identifier.toLowerCase()];
      sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(records));
      return { isLocked: false, remainingMinutes: 0 };
    } catch {
      return { isLocked: false, remainingMinutes: 0 };
    }
  },

  /**
   * Record a failed login attempt; lock if limit exceeded
   */
  recordFailedAttempt(identifier: string = 'global'): { isLockedNow: boolean; remainingAttempts: number } {
    try {
      const recordsRaw = sessionStorage.getItem(LOGIN_ATTEMPTS_KEY);
      const records: Record<string, LoginAttemptRecord> = recordsRaw ? JSON.parse(recordsRaw) : {};
      const key = identifier.toLowerCase();
      const current = records[key] || { attempts: 0, lockedUntil: null };

      current.attempts += 1;

      if (current.attempts >= MAX_ATTEMPTS) {
        current.lockedUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
        records[key] = current;
        sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(records));
        return { isLockedNow: true, remainingAttempts: 0 };
      }

      records[key] = current;
      sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(records));
      return { isLockedNow: false, remainingAttempts: MAX_ATTEMPTS - current.attempts };
    } catch {
      return { isLockedNow: false, remainingAttempts: MAX_ATTEMPTS };
    }
  },

  /**
   * Clear failed attempts upon successful login
   */
  resetAttempts(identifier: string = 'global'): void {
    try {
      const recordsRaw = sessionStorage.getItem(LOGIN_ATTEMPTS_KEY);
      if (recordsRaw) {
        const records: Record<string, LoginAttemptRecord> = JSON.parse(recordsRaw);
        delete records[identifier.toLowerCase()];
        sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(records));
      }
    } catch {
      // Ignore
    }
  }
};
