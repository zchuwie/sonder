import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/features/auth/AdminLoginForm";
import { getAdminUser } from "@/lib/auth/require-admin";

export default async function LoginPage() {
  if (await getAdminUser()) redirect("/");
  return (
    <main className="grid min-h-dvh place-items-center p-5">
      <AdminLoginForm />
    </main>
  );
}
