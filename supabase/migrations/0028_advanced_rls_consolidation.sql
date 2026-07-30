-- Consolidate and enforce advanced RLS for collaborators and doctors.
-- 'admin' and 'operator' retain organization-wide access.
-- 'collaborator' is restricted to assigned cases/tasks, and related contacts/documents/task_notes.
-- 'doctor' access is governed by is_case_collaborator().

-- ---------- CONTACTS ----------
drop policy if exists "Users can view organization contacts" on public.contacts;
drop policy if exists "Users can insert organization contacts" on public.contacts;
drop policy if exists "Users can update organization contacts" on public.contacts;

-- admin, operator view all in org.
-- collaborator views contacts if they have an assigned case for that contact.
create policy "Users can view organization contacts" on public.contacts
  for select using (
    organization_id in (
      select organization_id from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin','operator')
    )
    or (
      organization_id in (
        select organization_id from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'collaborator'
      )
      and exists (
        select 1 from public.cases c
        where c.contact_id = contacts.id and c.assigned_to = auth.uid()
      )
    )
    or (
      -- Doctor case is handled in 0016 by "Invited can view case contact", but adding here is safe
      exists (
        select 1 from public.cases c
        where c.contact_id = contacts.id and public.is_case_collaborator(c.id)
      )
    )
  );

create policy "Users can insert organization contacts" on public.contacts
  for insert with check (
    organization_id in (
      select organization_id from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin','operator')
    )
    -- collaborators and doctors cannot create contacts
  );

create policy "Users can update organization contacts" on public.contacts
  for update using (
    organization_id in (
      select organization_id from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin','operator')
    )
    or (
      organization_id in (
        select organization_id from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'collaborator'
      )
      and exists (
        select 1 from public.cases c
        where c.contact_id = contacts.id and c.assigned_to = auth.uid()
      )
    )
  );

-- ---------- DOCUMENTS ----------
drop policy if exists "Users can insert organization documents" on public.documents;
drop policy if exists "Users can update organization documents" on public.documents;

create policy "Users can insert organization documents" on public.documents
  for insert with check (
    organization_id in (
      select organization_id from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin','operator')
    )
    or (
      organization_id in (
        select organization_id from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'collaborator'
      )
      and case_id in (select id from public.cases where assigned_to = auth.uid())
    )
    or public.is_case_collaborator(case_id)
  );

create policy "Users can update organization documents" on public.documents
  for update using (
    organization_id in (
      select organization_id from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin','operator')
    )
    or (
      organization_id in (
        select organization_id from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'collaborator'
      )
      and case_id in (select id from public.cases where assigned_to = auth.uid())
    )
    or public.is_case_collaborator(case_id)
  );

-- ---------- TASK NOTES ----------
drop policy if exists "Users can view task notes" on public.task_notes;
drop policy if exists "Users can insert task notes" on public.task_notes;

create policy "Users can view task notes" on public.task_notes
  for select using (
    exists (
      select 1
      from public.tasks t
      join public.profiles p on p.id = auth.uid()
      where t.id = task_notes.task_id
        and t.organization_id = p.organization_id
        and (
          p.role in ('admin', 'operator')
          or (
            p.role = 'collaborator'
            and (
              t.assigned_to = auth.uid()
              or t.case_id in (select id from public.cases where assigned_to = auth.uid())
            )
          )
        )
    )
  );

create policy "Users can insert task notes" on public.task_notes
  for insert with check (
    exists (
      select 1
      from public.tasks t
      join public.profiles p on p.id = auth.uid()
      where t.id = task_notes.task_id
        and t.organization_id = p.organization_id
        and (
          p.role in ('admin', 'operator')
          or (
            p.role = 'collaborator'
            and (
              t.assigned_to = auth.uid()
              or t.case_id in (select id from public.cases where assigned_to = auth.uid())
            )
          )
        )
    )
  );
