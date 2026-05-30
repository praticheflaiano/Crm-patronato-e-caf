-- Tighten the private 'documents' bucket: replace bucket-wide authenticated access
-- with organization-scoped access derived from the case id in the object path.
-- Object paths follow the convention: {case_id}/...  (see app upload code in
-- src/components/documents/case-documents.tsx and MedicalCertificateForm.tsx).

drop policy if exists "Authenticated users can view documents bucket" on storage.objects;
drop policy if exists "Authenticated users can upload documents bucket" on storage.objects;
drop policy if exists "Authenticated users can update documents bucket" on storage.objects;
drop policy if exists "Authenticated users can delete documents bucket" on storage.objects;

create policy "Org members can read documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.cases c
    join public.profiles p on p.organization_id = c.organization_id
    where p.id = auth.uid()
      and c.id::text = (storage.foldername(name))[1]
  )
);

create policy "Org members can upload documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.cases c
    join public.profiles p on p.organization_id = c.organization_id
    where p.id = auth.uid()
      and c.id::text = (storage.foldername(name))[1]
  )
);

create policy "Org members can update documents"
on storage.objects for update to authenticated
using (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.cases c
    join public.profiles p on p.organization_id = c.organization_id
    where p.id = auth.uid()
      and c.id::text = (storage.foldername(name))[1]
  )
)
with check (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.cases c
    join public.profiles p on p.organization_id = c.organization_id
    where p.id = auth.uid()
      and c.id::text = (storage.foldername(name))[1]
  )
);

create policy "Org members can delete documents"
on storage.objects for delete to authenticated
using (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.cases c
    join public.profiles p on p.organization_id = c.organization_id
    where p.id = auth.uid()
      and c.id::text = (storage.foldername(name))[1]
  )
);
