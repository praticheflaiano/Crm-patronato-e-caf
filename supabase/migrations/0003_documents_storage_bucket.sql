insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update set public = false;

create policy "Authenticated users can view documents bucket"
on storage.objects for select
to authenticated
using (bucket_id = 'documents');

create policy "Authenticated users can upload documents bucket"
on storage.objects for insert
to authenticated
with check (bucket_id = 'documents');

create policy "Authenticated users can update documents bucket"
on storage.objects for update
to authenticated
using (bucket_id = 'documents')
with check (bucket_id = 'documents');

create policy "Authenticated users can delete documents bucket"
on storage.objects for delete
to authenticated
using (bucket_id = 'documents');
