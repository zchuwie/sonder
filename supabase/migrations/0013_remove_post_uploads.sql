-- Remove the post_uploads table and related RPC.
-- Images now upload directly to Storage at submit time; no staging table needed.

drop function if exists public.create_post_with_upload(
  text, text, double precision, double precision, text, text, jsonb, uuid, uuid
);

drop table if exists public.post_uploads cascade;
