// app/admin/page.jsx
import { requireRole } from "../lib/auth";
import AdminDashboard from "../components/admin/AdminDashboard";

export default async function Page() {
  // This will redirect if user is not an admin
  await requireRole(["admin"]);

  return <AdminDashboard />;
}
