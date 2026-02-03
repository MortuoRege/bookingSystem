// app/staff/page.jsx
import { requireRole } from "../lib/auth";
import StaffPage from "../components/staff/StaffDashboard";

export default async function Page() {
  // This will redirect if user is not staff
  await requireRole(["staff"]);

  return <StaffPage />;
}
