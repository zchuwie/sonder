-- Restore the INSERT policy on storage.objects so authenticated users
-- can upload images directly from the browser to their own folder.

create policy "Users upload into own post image folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
