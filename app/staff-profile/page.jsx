// app/staff-profile/page.jsx
import { requireRole } from "../lib/auth";
import StaffProfile from "../components/staff/StaffProfile";

export default async function StaffProfilePage() {
  // This will redirect if user is not staff
  await requireRole(["staff"]);

  return <StaffProfile />;
}
