import { MaintenanceToggle } from "@/features/settings/MaintenanceToggle";

export default function SettingsPage() {
  return (
    <div className="admin-soft-in space-y-5">
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-700">Workspace</p>
        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Admin settings live in Supabase policies, environment variables, and the admin_users table for now.
        </p>
      </section>

      <MaintenanceToggle />
    </div>
  );
}
