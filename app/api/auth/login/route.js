import bcrypt from "bcryptjs";
import { prisma } from "../../../prisma"; // adjust if your prisma export is elsewhere

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

  if (!normalizedEmail || !password) {
    return Response.json(
      { error: "Invalid email or password" },
      { status: 401 },
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

  return Response.json(jsonSafe({ ok: true, user: publicUser }));
}
