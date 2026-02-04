// app/providers/page.jsx
import { requireRole } from "../lib/auth";
import ProvidersPage from "../components/admin/providers";

export default async function Page() {
  // Only admins can access provider management
  await requireRole(["admin"]);

  return <ProvidersPage />;
}
