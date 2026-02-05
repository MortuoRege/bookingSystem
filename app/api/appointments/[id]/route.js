// app/api/appointments/[id]/route.js
import { prisma } from "../../../prisma";
import { requireAuthAPI } from "../../../lib/auth-api";

export async function DELETE(_req, { params }) {
  // Require authentication
  const authResult = await requireAuthAPI();
  if (authResult.error) {
    return authResult.response;
  }

  const user = authResult.user;

  const { id } = await params;
  const idNum = Number(id);

  if (!Number.isFinite(idNum) || idNum <= 0) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  // make sure this appointment belongs to the logged-in user
  const appt = await prisma.appointments.findUnique({
    where: { id: BigInt(idNum) },
    select: { id: true, customer_id: true },
  });

  if (!appt || appt.customer_id.toString() !== user.id.toString()) {
    return Response.json({ error: "Appointment not found" }, { status: 404 });
  }

  // actually delete; if you prefer soft-cancel, use update() and set status="cancelled"
  await prisma.appointments.delete({
    where: { id: BigInt(idNum) },
  });

  return Response.json({ ok: true });
}
