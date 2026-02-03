// app/providers/page.jsx
import { requireRole } from "../lib/auth";
import UserProvidersPage from "../components/user/providers";

export default async function ProvidersPage() {
  // Allow regular users and staff to browse providers
  await requireRole(["user", "staff"]);

  return <UserProvidersPage />;
}
