// lib/auth.js - Secure JWT-based authentication
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";
import { SignJWT, jwtVerify } from "jose";

// Use a strong secret key - MUST be set in environment variables
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ||
    "CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_IN_PRODUCTION",
);

const JWT_ALGORITHM = "HS256";
const JWT_EXPIRATION = "7d"; // 7 days

/**
 * Create a signed JWT token for a user
 */
export async function createToken(user) {
  const token = await new SignJWT({
    userId: user.id.toString(),
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .setIssuer("appointment-app")
    .setAudience("appointment-app")
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "appointment-app",
      audience: "appointment-app",
    });
    return payload;
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
}

/**
 * Get the current authenticated user from the token
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  // Fetch fresh user data from database
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
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Get user with role verification
 */
export async function getUserWithRole(userId) {
  if (!userId) return null;

  const user = await prisma.users.findUnique({
    where: { id: BigInt(userId) },
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
 * Require specific role(s) - redirect if user doesn't have permission
 */
export async function requireRole(allowedRoles) {
  const user = await requireAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect based on actual role
    if (user?.role === "admin") {
      redirect("/admin");
    } else if (user?.role === "staff") {
      redirect("/staff");
    } else {
      redirect("/user");
    }
  }

  return user;
}

/**
 * Set authentication cookie with signed token
 */
export async function setAuthCookie(user) {
  const token = await createToken(user);
  const cookieStore = await cookies();

  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set("authToken", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict", // Changed from 'lax' to 'strict' for better CSRF protection
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clear authentication cookie (logout)
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("authToken");
}
