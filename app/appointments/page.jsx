// app/appointments/page.jsx
import { requireRole } from "../lib/auth";
import AdminAppointments from "../components/admin/appointments";

export default async function AppointmentsPage() {
  // Only admins can access appointment management
  await requireRole(["admin"]);

  return <AdminAppointments />;
}
