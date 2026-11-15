-- ==============================================================================
-- STORAGE BUCKET SETUP: MEDIA (POSTS & AVATARS)
-- ==============================================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public media access" on storage.objects;
drop policy if exists "Authenticated users can upload to media bucket" on storage.objects;
drop policy if exists "Authenticated users can update their uploads" on storage.objects;
drop policy if exists "Authenticated users can delete their uploads" on storage.objects;

create policy "Public media access"
on storage.objects for select
using ( bucket_id = 'media' );

create policy "Authenticated users can upload to media bucket"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'media' );

create policy "Authenticated users can update their uploads"
on storage.objects for update
to authenticated
using ( bucket_id = 'media' );

create policy "Authenticated users can delete their uploads"
on storage.objects for delete
to authenticated
using ( bucket_id = 'media' );
