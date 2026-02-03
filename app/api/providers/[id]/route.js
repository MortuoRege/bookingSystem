// app/api/providers/[id]/route.js
import { prisma } from "../../../prisma";

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function GET(_req, { params }) {
  const { id } = await params;
  const idNum = Number(id);

  if (!Number.isFinite(idNum) || idNum <= 0) {
    return Response.json({ error: "Invalid provider id" }, { status: 400 });
  }

  try {
    const row = await prisma.staff.findUnique({
      where: { user_id: BigInt(idNum) },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    if (!row) {
      return Response.json({ error: "Provider not found" }, { status: 404 });
    }

    const provider = {
      id: row.user_id,
      name: row.users.full_name,
      email: row.users.email,
      specialty: row.specialty,
      title: row.title,
      bio: row.bio,
      availability: {
        mon_start: row.mon_start,
        mon_end: row.mon_end,
        tue_start: row.tue_start,
        tue_end: row.tue_end,
        wed_start: row.wed_start,
        wed_end: row.wed_end,
        thu_start: row.thu_start,
        thu_end: row.thu_end,
        fri_start: row.fri_start,
        fri_end: row.fri_end,
      },
    };

    return Response.json(jsonSafe({ provider }), { status: 200 });
  } catch (err) {
    console.error("GET /api/providers/[id] ERROR:", err);
    return Response.json({ error: "Failed to load provider" }, { status: 500 });
  }
}
