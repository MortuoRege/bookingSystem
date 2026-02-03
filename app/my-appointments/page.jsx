// app/my-appointments/page.jsx
import { requireRole } from "../lib/auth";
import MyAppointmentsPage from "../components/user/my-appointments";

export default async function Page() {
  // Allow regular users and staff to see their appointments
  await requireRole(["user", "staff"]);

  return <MyAppointmentsPage />;
}
