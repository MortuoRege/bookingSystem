import bcrypt from "bcryptjs";
import { prisma } from "../../../prisma";
import { rateLimit, isValidEmail, isValidPassword, sanitizeInput } from "../../../lib/auth-api";

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  const fullName = sanitizeInput(String(body.fullName ?? "").trim());
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body.password ?? "");

  if (!fullName || !email || !password) {
    return Response.json(
      { error: "fullName, email, password required" },
      { status: 400 },
    );
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return Response.json(
      { error: "Invalid email format" },
      { status: 400 },
    );
  }

  // Validate password strength
  const passwordValidation = isValidPassword(password);
  if (!passwordValidation.valid) {
    return Response.json(
      { error: passwordValidation.error },
      { status: 400 },
    );
  }

  // Rate limiting - 3 registration attempts per hour per email
  const limitResult = rateLimit(`register:${email}`, 3, 60 * 60 * 1000);

  if (limitResult.limited) {
    return Response.json(
      {
        error: "Too many registration attempts. Please try again later.",
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

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    // IMPORTANT: model/field names must match your introspected schema.prisma
    const user = await prisma.users.create({
      data: {
        full_name: fullName,
        email,
        password_hash: passwordHash,
        role: "user",
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
      },
    });

    return Response.json(jsonSafe({ ok: true, user }), { status: 201 });
  } catch (err) {
    // Unique constraint (email already exists)
    if (err?.code === "P2002") {
      return Response.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    console.error("REGISTER ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
