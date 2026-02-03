import { prisma } from "../../../prisma";

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userIdRaw = url.searchParams.get("userId");

    if (!userIdRaw || !/^\d+$/.test(userIdRaw)) {
      return Response.json({ error: "Invalid userId" }, { status: 400 });
    }

    const userId = BigInt(userIdRaw);

    // staff table key is user_id (no separate id)
    const staff = await prisma.staff.findUnique({
      where: { user_id: userId },
      select: { user_id: true },
    });

    if (!staff) {
      return Response.json({ error: "Not a staff user" }, { status: 403 });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    // appointments.staff_id most likely references staff.user_id in YOUR schema
    const staffKey = staff.user_id;

    const [appointmentsAllTime, appointmentsToday] = await Promise.all([
      prisma.appointments.count({ where: { staff_id: staffKey } }),
      prisma.appointments.count({
        where: {
          staff_id: staffKey,
          starts_at: { gte: startOfToday, lt: startOfTomorrow },
        },
      }),
    ]);

    return Response.json(
      jsonSafe({
        userId,
        staffId: staffKey,
        appointmentsAllTime,
        appointmentsToday,
      }),
    );
  } catch (err) {
    console.error("STAFF APPOINTMENT STATS ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
