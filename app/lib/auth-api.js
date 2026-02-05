// lib/auth-api.js - Secure authentication helpers for API routes
import { cookies } from "next/headers";
import { prisma } from "../prisma";
import { verifyToken } from "./auth";

/**
 * Get authenticated user from API request using JWT
 * Returns user object or null if not authenticated
 */
export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.users.findUnique({
    where: { id: BigInt(payload.userId) },
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
    },
  });

  return user;
}

/**
 * Require authentication for API route
 * Returns user or 401 response
 */
export async function requireAuthAPI() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      error: true,
      response: Response.json(
        { error: "Not authenticated" },
        { status: 401 }
      ),
    };
  }

  return { error: false, user };
}

/**
 * Require specific role(s) for API route
 * Returns user or 401/403 response
 */
export async function requireRoleAPI(allowedRoles) {
  const authResult = await requireAuthAPI();

  if (authResult.error) {
    return authResult;
  }

  const user = authResult.user;

  if (!allowedRoles.includes(user.role)) {
    return {
      error: true,
      response: Response.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return { error: false, user };
}

/**
 * IMPROVED: Database-backed rate limiter using Prisma
 * This is a simple implementation - for production, consider Redis or a dedicated service
 * 
 * You'll need to create a rate_limits table:
 * 
 * CREATE TABLE rate_limits (
 *   identifier VARCHAR(255) PRIMARY KEY,
 *   count INTEGER NOT NULL DEFAULT 0,
 *   reset_time TIMESTAMPTZ NOT NULL,
 *   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 */

// Fallback to in-memory if database rate limiting fails
const rateLimitStore = new Map();

export async function rateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const resetTime = new Date(now + windowMs);

  try {
    // Try database-backed rate limiting first (if you have the table)
    // Uncomment this section after creating the rate_limits table
    /*
    const record = await prisma.$queryRaw`
      INSERT INTO rate_limits (identifier, count, reset_time)
      VALUES (${identifier}, 1, ${resetTime})
      ON CONFLICT (identifier) DO UPDATE SET
        count = CASE 
          WHEN rate_limits.reset_time < NOW() THEN 1
          ELSE rate_limits.count + 1
        END,
        reset_time = CASE
          WHEN rate_limits.reset_time < NOW() THEN ${resetTime}
          ELSE rate_limits.reset_time
        END,
        updated_at = NOW()
      RETURNING count, reset_time
    `;

    if (record[0].count > maxAttempts) {
      const retryAfter = Math.ceil((new Date(record[0].reset_time) - now) / 1000);
      return {
        limited: true,
        remaining: 0,
        retryAfter,
      };
    }

    return {
      limited: false,
      remaining: maxAttempts - record[0].count,
    };
    */

    // Fallback to in-memory rate limiting
    const key = identifier;

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return { limited: false, remaining: maxAttempts - 1 };
    }

    const record = rateLimitStore.get(key);

    // Reset if window expired
    if (now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return { limited: false, remaining: maxAttempts - 1 };
    }

    // Increment count
    record.count++;

    if (record.count > maxAttempts) {
      return {
        limited: true,
        remaining: 0,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      };
    }

    return { limited: false, remaining: maxAttempts - record.count };
  } catch (error) {
    console.error("Rate limiting error:", error);
    // On error, allow the request (fail open)
    return { limited: false, remaining: maxAttempts };
  }
}

/**
 * Clean up old rate limit entries periodically
 * NOTE: This only works for in-memory store. For database, use a cron job or scheduled task.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize user input to prevent XSS
 * Note: This is basic sanitization. For production, consider using a library like DOMPurify
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent basic XSS
    .slice(0, 1000); // Limit length to prevent DoS
}

/**
 * Validate password strength
 */
export function isValidPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  
  if (password.length > 128) {
    return { valid: false, error: "Password is too long" };
  }
  
  // Check for at least one number, one letter
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  
  if (!hasNumber || !hasLetter) {
    return { 
      valid: false, 
      error: "Password must contain at least one letter and one number" 
    };
  }
  
  return { valid: true };
}
