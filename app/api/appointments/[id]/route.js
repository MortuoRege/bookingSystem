// app/api/appointments/[id]/route.js
import { cookies } from "next/headers";
import { prisma } from "../../../prisma";

export async function DELETE(_req, { params }) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

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

  if (!appt || appt.customer_id.toString() !== userId) {
    return Response.json({ error: "Appointment not found" }, { status: 404 });
  }

  // actually delete; if you prefer soft-cancel, use update() and set status="cancelled"
  await prisma.appointments.delete({
    where: { id: BigInt(idNum) },
  });

  return Response.json({ ok: true });
}
