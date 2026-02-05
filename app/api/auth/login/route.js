import bcrypt from "bcryptjs";
import { prisma } from "../../../prisma";
import { setAuthCookie } from "../../../lib/auth";
import { rateLimit, isValidEmail } from "../../../lib/auth-api";

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  const emailRaw = String(body.email ?? "");
  const password = String(body.password ?? "");

  const normalizedEmail = emailRaw.trim().toLowerCase();

  // Validate email format
  if (!isValidEmail(normalizedEmail)) {
    return Response.json(
      { error: "Invalid email format" },
      { status: 400 },
    );
  }

  if (!normalizedEmail || !password) {
    return Response.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  // Rate limiting - 5 attempts per 15 minutes per email
  const limitResult = rateLimit(`login:${normalizedEmail}`, 5, 15 * 60 * 1000);

  if (limitResult.limited) {
    return Response.json(
      {
        error: "Too many login attempts. Please try again later.",
        retryAfter: limitResult.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(limitResult.retryAfter),
        },
      },
    );
  }

  // IMPORTANT: model/field names must match your schema.prisma introspection
  const user = await prisma.users.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      full_name: true,
      email: true,
      role: true,
      password_hash: true,
    },
  });

  if (!user) {
    return Response.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return Response.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  // remove password_hash before returning
  const { password_hash, ...publicUser } = user;

  // Set secure JWT token in httpOnly cookie
  await setAuthCookie(publicUser);

  return Response.json(jsonSafe({ ok: true, user: publicUser }));
}
