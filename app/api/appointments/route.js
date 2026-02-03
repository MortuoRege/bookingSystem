// app/api/appointments/route.js
import { prisma } from "../../prisma";
import { cookies } from "next/headers";

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const appointments = await prisma.appointments.findMany({
    where: { customer_id: BigInt(userId) },
    include: {
      users_appointments_staff_idTousers: {
        select: {
          id: true,
          full_name: true,
          email: true,
          staff: true, // This gets the related staff record
        },
      },
    },
    orderBy: { starts_at: "asc" },
  });

  // Transform to cleaner format
  const formattedAppointments = appointments.map((apt) => ({
    id: apt.id.toString(),
    customerId: apt.customer_id.toString(),
    staffId: apt.staff_id.toString(),
    startsAt: apt.starts_at,
    endsAt: apt.ends_at,
    status: apt.status,
    createdAt: apt.created_at,
    staff: {
      id: apt.users_appointments_staff_idTousers.id.toString(),
      name: apt.users_appointments_staff_idTousers.full_name,
      email: apt.users_appointments_staff_idTousers.email,
      specialty:
        apt.users_appointments_staff_idTousers.staff?.[0]?.specialty || null,
      title: apt.users_appointments_staff_idTousers.staff?.[0]?.title || null,
    },
  }));

  return Response.json({ appointments: formattedAppointments });
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { customerId, staffId, startsAt, endsAt } = body;

    if (!customerId || !staffId || !startsAt || !endsAt) {
      return Response.json(
        { error: "customerId, staffId, startsAt, endsAt are required" },
        { status: 400 },
      );
    }

    const customer_id = BigInt(customerId);
    const staff_id = BigInt(staffId);
    const starts_at = new Date(startsAt);
    const ends_at = new Date(endsAt);

    if (!(starts_at instanceof Date) || isNaN(starts_at.getTime())) {
      return Response.json({ error: "Invalid startsAt" }, { status: 400 });
    }

    if (!(ends_at instanceof Date) || isNaN(ends_at.getTime())) {
      return Response.json({ error: "Invalid endsAt" }, { status: 400 });
    }

    if (ends_at <= starts_at) {
      return Response.json(
        { error: "endsAt must be after startsAt" },
        { status: 400 },
      );
    }

    const created = await prisma.appointments.create({
      data: {
        customer_id,
        staff_id,
        starts_at,
        ends_at,
        status: "pending",
      },
    });

    return Response.json(jsonSafe({ ok: true, appointment: created }), {
      status: 201,
    });
  } catch (err) {
    console.error("CREATE APPOINTMENT ERROR:", err);

    // Check if this is a PostgreSQL exclusion constraint violation (23P01)
    // This happens when appointments overlap for the same staff member
    if (
      err.code === "P2034" ||
      (err.meta && err.meta.code === "23P01") ||
      err.message?.includes("no_overlapping_staff_appointments") ||
      err.message?.includes(
        "conflicting key value violates exclusion constraint",
      )
    ) {
      return Response.json(
        {
          error:
            "Time slot not available. This provider already has an appointment during this time. Please choose a different time slot.",
          code: "APPOINTMENT_OVERLAP",
        },
        { status: 409 }, // 409 Conflict
      );
    }

    // Generic server error for other cases
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
