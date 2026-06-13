import { AdminReportsTable } from "@/features/admin/components/AdminReportsTable";
import { getAdminReports } from "@/features/admin/server/admin-queries";

export default async function ReportsPage() {
  return <AdminReportsTable reports={await getAdminReports()} />;
}
