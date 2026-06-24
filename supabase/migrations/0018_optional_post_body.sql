-- Make post body optional (title is the only required text field now)
alter table public.posts alter column body drop not null;
alter table public.posts drop constraint if exists posts_body_check;
alter table public.posts add constraint posts_body_check
  check (body is null or char_length(body) between 1 and 1000);
