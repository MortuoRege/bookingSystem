// app/api/appointments/route.js
import { prisma } from "../../prisma";
import { requireAuthAPI } from "../../lib/auth-api";

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function GET() {
  // Require authentication
  const authResult = await requireAuthAPI();
  if (authResult.error) {
    return authResult.response;
  }

  const user = authResult.user;

  const appointments = await prisma.appointments.findMany({
    where: { customer_id: user.id },
    include: {
      users_appointments_staff_idTousers: {
        select: {
          id: true,
          full_name: true,
          email: true,
          staff: true,
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
    // CRITICAL FIX: Require authentication
    const authResult = await requireAuthAPI();
    if (authResult.error) {
      return authResult.response;
    }

    const user = authResult.user;

    const body = await req.json().catch(() => ({}));
    // SECURITY FIX: Don't accept customerId from client - use authenticated user's ID
    const { staffId, startsAt, endsAt } = body;

    if (!staffId || !startsAt || !endsAt) {
      return Response.json(
        { error: "staffId, startsAt, endsAt are required" },
        { status: 400 },
      );
    }

    // CRITICAL: Use the authenticated user's ID, not client-provided customerId
    const customer_id = user.id;
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

    // Prevent booking appointments in the past
    const now = new Date();
    if (starts_at < now) {
      return Response.json(
        { error: "Cannot book appointments in the past" },
        { status: 400 },
      );
    }

    // Prevent booking appointments too far in the future (e.g., 6 months)
    const maxFutureDate = new Date();
    maxFutureDate.setMonth(maxFutureDate.getMonth() + 6);
    if (starts_at > maxFutureDate) {
      return Response.json(
        { error: "Cannot book appointments more than 6 months in advance" },
        { status: 400 },
      );
    }

    // Verify staff member exists and has role 'staff'
    const staffMember = await prisma.users.findUnique({
      where: { id: staff_id },
      select: { id: true, role: true },
    });

    if (!staffMember || staffMember.role !== "staff") {
      return Response.json({ error: "Invalid staff member" }, { status: 400 });
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
        { status: 409 },
      );
    }

    // Generic server error for other cases
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
