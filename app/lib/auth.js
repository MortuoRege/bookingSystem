// lib/auth.js
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";

export async function requireAuth() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/login");
  }

  return userId;
}

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

export async function requireRole(allowedRoles) {
  const userId = await requireAuth();
  const user = await getUserWithRole(userId);

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

// Helper to get current user without redirecting
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) return null;

  return await getUserWithRole(userId);
}
