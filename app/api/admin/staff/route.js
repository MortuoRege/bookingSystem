import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../../prisma";
import { requireRoleAPI } from "../../../lib/auth";

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function POST(req) {
  // Require admin role
  const authResult = await requireRoleAPI(["admin"]);
  if (authResult.error) {
    return authResult.response;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { fullName, email, specialty, title, bio, password } = body;

    if (!fullName || !email || !specialty) {
      return Response.json(
        { error: "fullName, email, specialty required" },
        { status: 400 },
      );
    }

    const cleanName = String(fullName).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanSpecialty = String(specialty).trim();
    const cleanTitle = title ? String(title).trim() : null;
    const cleanBio = bio ? String(bio).trim() : null;

    // Use provided password if present, otherwise generate temp
    let tempPassword = null;
    let plainPassword = password ? String(password) : null;

    if (!plainPassword) {
      tempPassword = crypto.randomBytes(9).toString("base64url");
      plainPassword = tempPassword;
    }

    if (plainPassword.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(plainPassword, 12);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          full_name: cleanName,
          email: cleanEmail,
          password_hash: passwordHash,
          role: "staff",
        },
        select: { id: true, full_name: true, email: true, role: true },
      });

      await tx.staff.create({
        data: {
          user_id: user.id,
          specialty: cleanSpecialty,
          title: cleanTitle,
          bio: cleanBio,
        },
      });

      return user;
    });

    return Response.json(
      jsonSafe({ ok: true, staffUser: created, tempPassword }),
      { status: 201 },
    );
  } catch (err) {
    if (err?.code === "P2002") {
      return Response.json({ error: "Email already exists" }, { status: 409 });
    }
    console.error("CREATE STAFF ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
