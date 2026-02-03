import { prisma } from "../../../prisma";

const DAY_FIELDS = {
  sun: { start: "sun_start", end: "sun_end" },
  mon: { start: "mon_start", end: "mon_end" },
  tue: { start: "tue_start", end: "tue_end" },
  wed: { start: "wed_start", end: "wed_end" },
  thu: { start: "thu_start", end: "thu_end" },
  fri: { start: "fri_start", end: "fri_end" },
  sat: { start: "sat_start", end: "sat_end" },
};

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

function toHHMM(v) {
  if (v == null) return null;
  if (typeof v === "string") return v.slice(0, 5);
  if (v instanceof Date) return v.toISOString().slice(11, 16);
  return String(v).slice(0, 5);
}

// If your Prisma fields are DateTime @db.Time, you must send a Date.
// If your fields are String, returning a string is fine.
// This helper makes a safe Date in UTC for "HH:MM".
function timeToDbValue(hhmm) {
  if (!hhmm) return null;
  // "09:00" -> "1970-01-01T09:00:00.000Z"
  return new Date(`1970-01-01T${hhmm}:00.000Z`);
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userIdRaw = url.searchParams.get("userId");
    if (!userIdRaw)
      return Response.json({ error: "Missing userId" }, { status: 400 });

    const userId = BigInt(userIdRaw);

    // Build select dynamically
    const select = { user_id: true };
    for (const { start, end } of Object.values(DAY_FIELDS)) {
      select[start] = true;
      select[end] = true;
    }

    const staff = await prisma.staff.findUnique({
      where: { user_id: userId },
      select,
    });

    if (!staff)
      return Response.json({ error: "Staff not found" }, { status: 404 });

    const days = {};
    for (const [day, f] of Object.entries(DAY_FIELDS)) {
      days[day] = {
        start: toHHMM(staff[f.start]),
        end: toHHMM(staff[f.end]),
      };
    }

    return Response.json(jsonSafe({ days }));
  } catch (err) {
    console.error("AVAILABILITY GET ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, day, start, end } = body || {};

    if (!userId)
      return Response.json({ error: "Missing userId" }, { status: 400 });
    if (!DAY_FIELDS[day])
      return Response.json({ error: "Invalid day" }, { status: 400 });
    if (!start || !end)
      return Response.json({ error: "Missing start/end" }, { status: 400 });
    if (start >= end)
      return Response.json(
        { error: "Start must be before end" },
        { status: 400 },
      );

    const uid = BigInt(userId);

    const { start: startField, end: endField } = DAY_FIELDS[day];

    // If your schema uses DateTime @db.Time, use timeToDbValue().
    // If your schema uses String, replace these two lines with:  const s = start; const e = end;
    const s = timeToDbValue(start);
    const e = timeToDbValue(end);

    await prisma.staff.update({
      where: { user_id: uid },
      data: {
        [startField]: s,
        [endField]: e,
      },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("AVAILABILITY POST ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { userId, day } = body || {};

    if (!userId)
      return Response.json({ error: "Missing userId" }, { status: 400 });
    if (!DAY_FIELDS[day])
      return Response.json({ error: "Invalid day" }, { status: 400 });

    const uid = BigInt(userId);
    const { start: startField, end: endField } = DAY_FIELDS[day];

    await prisma.staff.update({
      where: { user_id: uid },
      data: {
        [startField]: null,
        [endField]: null,
      },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("AVAILABILITY DELETE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
