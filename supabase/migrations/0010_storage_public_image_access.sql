-- Allow any authenticated user (including anonymous) to read post images
-- that belong to approved or flagged posts (visible on public map).
-- ponytail: replaces edge function approach. Ceiling: subquery per SELECT, fine for signed URL generation.

create policy "Public can view approved post images"
on storage.objects for select to authenticated
using (
  bucket_id = 'post-images'
  and exists (
    select 1 from public.posts
    where posts.image_path = name
      and posts.status in ('approved', 'flagged')
      and posts.deleted_at is null
  )
);
