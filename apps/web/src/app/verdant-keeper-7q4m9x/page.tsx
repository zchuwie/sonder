import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/features/admin/components/AdminLoginForm";
import { getAdminUser } from "@/lib/auth/admin-authorization";

export const metadata: Metadata = {
  title: "Private access",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PrivateAccessPage() {
  if (await getAdminUser()) redirect("/admin");
  return (
    <main className="grid min-h-dvh place-items-center bg-muted/40 p-5">
      <AdminLoginForm />
    </main>
  );
}
