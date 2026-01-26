import { prisma } from "../../../prisma";

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function GET() {
  try {
    const [usersCount, staffCount] = await Promise.all([
      prisma.users.count({ where: { role: "user" } }),
      prisma.users.count({ where: { role: "staff" } }),
    ]);

    const userList = await prisma.users.findMany({
      where: { role: "user" },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
      },
      orderBy: { id: "asc" },
    });

    // join users -> staff
    const staffList = await prisma.users.findMany({
      where: { role: "staff" },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        staff: {
          select: { specialty: true },
        },
      },
      orderBy: { id: "asc" },
    });

    // Shape output like your old route (name alias + flatten staff.specialty)
    const payload = {
      users: usersCount,
      staff: staffCount,
      userList: userList.map((u) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        role: u.role,
      })),
      staffList: staffList.map((u) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        role: u.role,
        specialty: u.staff?.specialty ?? null,
      })),
    };

    return Response.json(jsonSafe(payload));
  } catch (err) {
    console.error("ADMIN STATS ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
