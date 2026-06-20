-- Fix: column-level grant on post_reports.status was lost when the column type
-- was altered in migration 0008. Re-grant update permission for admins.

grant update (status) on public.post_reports to authenticated;

-- Ensure the RLS policy still exists
drop policy if exists "Admins can manage reports" on public.post_reports;
create policy "Admins can manage reports"
on public.post_reports for update to authenticated
using (public.is_admin())
with check (public.is_admin());
