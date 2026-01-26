import bcrypt from "bcryptjs";
import { prisma } from "../../../prisma"; // adjust if your prisma export is elsewhere

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  const fullName = String(body.fullName ?? "").trim();
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

  if (password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    // Equivalent to your "where" debug query:
    const whereRows = await prisma.$queryRaw`
      select current_database() as db,
             current_schema() as schema,
             current_user as db_user
    `;
    const where = whereRows?.[0] ?? null;

    // IMPORTANT: model/field names must match your introspected schema.prisma
    // Your SQL used: full_name, email, password_hash, role
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

    return Response.json(jsonSafe({ ok: true, where, user }), { status: 201 });
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
