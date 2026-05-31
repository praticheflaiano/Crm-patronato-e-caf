-- Restrict internal collaborators to only the cases/tasks/documents assigned to
-- them, while leaving admin/operator org-wide access and external-doctor
-- per-case access (is_case_collaborator) untouched.
-- Applied and verified on the remote database.

-- ---------- CASES ----------
drop policy if exists "Users can view organization cases" on public.cases;
create policy "Users can view organization cases" on public.cases
  for select using (
    organization_id in (
      select organization_id from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin','operator')
    )
  );

drop policy if exists "Collaborators view assigned cases" on public.cases;
create policy "Collaborators view assigned cases" on public.cases
  for select using (
    assigned_to = auth.uid()
    and organization_id in (
      select organization_id from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'collaborator'
    )
  );

drop policy if exists "Users can update organization cases" on public.cases;
create policy "Users can update organization cases" on public.cases
  for update using (
    organization_id in (
      select organization_id from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin','operator')
    )
    or (
      assigned_to = auth.uid()
      and organization_id in (
        select organization_id from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'collaborator'
      )
    )
  );

-- ---------- TASKS ----------
drop policy if exists "Users can view organization tasks" on public.tasks;
create policy "Users can view organization tasks" on public.tasks
  for select using (
    organization_id in (
      select organization_id from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin','operator')
    )
  );

drop policy if exists "Collaborators view assigned tasks" on public.tasks;
create policy "Collaborators view assigned tasks" on public.tasks
  for select using (
    organization_id in (
      select organization_id from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'collaborator'
    )
    and (
      assigned_to = auth.uid()
      or case_id in (select id from public.cases where assigned_to = auth.uid())
    )
  );

drop policy if exists "Users can update organization tasks" on public.tasks;
create policy "Users can update organization tasks" on public.tasks
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
      and (
        assigned_to = auth.uid()
        or case_id in (select id from public.cases where assigned_to = auth.uid())
      )
    )
  );

-- ---------- DOCUMENTS ----------
drop policy if exists "Users can view organization documents" on public.documents;
create policy "Users can view organization documents" on public.documents
  for select using (
    organization_id in (
      select organization_id from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin','operator')
    )
  );

drop policy if exists "Collaborators view assigned documents" on public.documents;
create policy "Collaborators view assigned documents" on public.documents
  for select using (
    organization_id in (
      select organization_id from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'collaborator'
    )
    and case_id in (select id from public.cases where assigned_to = auth.uid())
  );

-- RLS helpers are only used inside policies; revoke direct RPC access
-- (including the default PUBLIC grant) so they are not callable via REST.
revoke execute on function public.is_case_collaborator(uuid) from anon, authenticated, public;
revoke execute on function public.is_org_member_of_case(uuid) from anon, authenticated, public;
revoke execute on function public.get_doctor_assigned_cases(uuid) from anon, authenticated, public;
