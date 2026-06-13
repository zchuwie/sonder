import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin-authorization";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return children;
}
