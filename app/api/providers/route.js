// app/api/providers/route.js
import { prisma } from "../../prisma";

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function GET() {
  try {
    const staffRows = await prisma.staff.findMany({
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { user_id: "asc" },
    });

    const providers = staffRows.map((row) => ({
      id: row.user_id, // this is the provider ID we’ll use in URLs
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
    }));

    return Response.json(jsonSafe({ providers }), { status: 200 });
  } catch (err) {
    console.error("GET /api/providers ERROR:", err);
    return Response.json(
      { error: "Failed to load providers" },
      { status: 500 },
    );
  }
}
