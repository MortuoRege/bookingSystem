// app/users/page.jsx
import { requireRole } from "../lib/auth";
import UsersPage from "../components/admin/users";

export default async function Page() {
  // Only admins can access user management
  await requireRole(["admin"]);

  return <UsersPage />;
}
