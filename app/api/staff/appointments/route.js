// app/api/staff/appointments/route.js
import { prisma } from "../../../prisma";
import { requireRoleAPI } from "../../../lib/auth-api";

function jsonSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

// GET appointments for the currently logged-in staff member
export async function GET(req) {
  try {
    // Require staff role
    const authResult = await requireRoleAPI(["staff"]);
    if (authResult.error) {
      return authResult.response;
    }

    const user = authResult.user;

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    // Build where clause - MUST include staff_id matching current user
    const whereClause = {
      staff_id: user.id,
      ...(statusFilter && statusFilter !== "all"
        ? { status: statusFilter }
        : {}),
    };

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
      },
      orderBy: { starts_at: "asc" },
    });

    // Transform to cleaner format
    const formattedAppointments = appointments.map((apt) => ({
      id: apt.id.toString(),
      patient: {
        id: apt.users_appointments_customer_idTousers.id.toString(),
        name: apt.users_appointments_customer_idTousers.full_name,
        email: apt.users_appointments_customer_idTousers.email,
      },
      startsAt: apt.starts_at,
      endsAt: apt.ends_at,
      status: apt.status,
      createdAt: apt.created_at,
    }));

    return Response.json(jsonSafe({ appointments: formattedAppointments }));
  } catch (error) {
    console.error("Error fetching staff appointments:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH - Update appointment status (staff can update their own appointments)
export async function PATCH(req) {
  try {
    // Require staff role
    const authResult = await requireRoleAPI(["staff"]);
    if (authResult.error) {
      return authResult.response;
    }

    const user = authResult.user;

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

    // Verify this appointment belongs to the current staff member
    const appointment = await prisma.appointments.findUnique({
      where: { id: BigInt(appointmentId) },
    });

    if (!appointment) {
      return Response.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (appointment.staff_id.toString() !== user.id.toString()) {
      return Response.json(
        { error: "You can only update your own appointments" },
        { status: 403 },
      );
    }

    // Update the appointment
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

// DELETE - Staff can delete/refuse appointments assigned to them
export async function DELETE(req) {
  try {
    // Require staff role
    const authResult = await requireRoleAPI(["staff"]);
    if (authResult.error) {
      return authResult.response;
    }

    const user = authResult.user;

    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get("id");

    if (!appointmentId) {
      return Response.json(
        { error: "appointmentId is required" },
        { status: 400 },
      );
    }

    // Verify this appointment belongs to the current staff member
    const appointment = await prisma.appointments.findUnique({
      where: { id: BigInt(appointmentId) },
    });

    if (!appointment) {
      return Response.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (appointment.staff_id.toString() !== user.id.toString()) {
      return Response.json(
        { error: "You can only delete your own appointments" },
        { status: 403 },
      );
    }

    // Delete the appointment
    await prisma.appointments.delete({
      where: { id: BigInt(appointmentId) },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
