import { AdminDashboard } from "@/features/admin/components/AdminDashboard";
import { getAdminMarkers } from "@/features/admin/server/admin-queries";

export default async function AdminPage() {
  return <AdminDashboard initialMarkers={await getAdminMarkers()} />;
}
