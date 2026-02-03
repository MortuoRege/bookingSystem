// app/availability/page.jsx
import { requireRole } from "../lib/auth";
import Availability from "../components/staff/availability";

export default async function Page() {
  // This will redirect if user is not staff
  await requireRole(["staff"]);

  return <Availability />;
}
