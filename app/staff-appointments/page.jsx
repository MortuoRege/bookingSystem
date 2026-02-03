// app/staff-appointments/page.jsx
import { requireRole } from "../lib/auth";
import StaffAppointments from "../components/staff/StaffAppointments";

export default async function StaffAppointmentsPage() {
  // This will redirect if user is not staff
  await requireRole(["staff"]);

  return <StaffAppointments />;
}
