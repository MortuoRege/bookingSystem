// app/api/admin/appointments/route.js
import { prisma } from "../../../prisma";
import { requireRoleAPI } from "../../../lib/auth-api";

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

// GET all appointments (admin only)
export async function GET(req) {
  // Require admin role
  const authResult = await requireRoleAPI(["admin"]);
  if (authResult.error) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    const whereClause =
      statusFilter && statusFilter !== "all" ? { status: statusFilter } : {};

    const appointments = await prisma.appointments.findMany({
      where: whereClause,
      include: {
        users_appointments_customer_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        users_appointments_staff_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true,
            staff: {
              select: {
                specialty: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { starts_at: "desc" },
    });

    // Transform to cleaner format
    const formattedAppointments = appointments.map((apt) => ({
      id: apt.id.toString(),
      patient: {
        id: apt.users_appointments_customer_idTousers.id.toString(),
        name: apt.users_appointments_customer_idTousers.full_name,
        email: apt.users_appointments_customer_idTousers.email,
      },
      provider: {
        id: apt.users_appointments_staff_idTousers.id.toString(),
        name: apt.users_appointments_staff_idTousers.full_name,
        email: apt.users_appointments_staff_idTousers.email,
        specialty:
          apt.users_appointments_staff_idTousers.staff?.specialty ||
          "Specialist",
        title: apt.users_appointments_staff_idTousers.staff?.title || "Dr.",
      },
      startsAt: apt.starts_at,
      endsAt: apt.ends_at,
      status: apt.status,
      createdAt: apt.created_at,
    }));

    return Response.json(jsonSafe({ appointments: formattedAppointments }));
  } catch (error) {
    console.error("Error fetching admin appointments:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH - Update appointment status
export async function PATCH(req) {
  // Require admin role
  const authResult = await requireRoleAPI(["admin"]);
  if (authResult.error) {
    return authResult.response;
  }

  try {
    const body = await req.json();
    const { appointmentId, status } = body;

    if (!appointmentId || !status) {
      return Response.json(
        { error: "appointmentId and status are required" },
        { status: 400 },
      );
    }

    const validStatuses = ["pending", "approved", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return Response.json(
        {
          error:
            "Invalid status. Must be: pending, approved, cancelled, or completed",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.appointments.update({
      where: { id: BigInt(appointmentId) },
      data: { status },
    });

    return Response.json(jsonSafe({ ok: true, appointment: updated }));
  } catch (error) {
    console.error("Error updating appointment:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
