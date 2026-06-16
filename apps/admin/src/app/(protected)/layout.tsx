import { AdminShell } from "@/features/layout/AdminShell";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
