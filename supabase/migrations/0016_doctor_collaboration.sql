-- =====================================================================
-- Doctor collaboration: external certifying doctors invited per-case,
-- a shared message board, and structured requests between operator & doctor.
-- Applied and verified on the remote database.
-- =====================================================================

create table if not exists public.case_collaborators (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'doctor' check (role in ('doctor','collaborator')),
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (case_id, user_id)
);
create index if not exists case_collaborators_user_idx on public.case_collaborators (user_id);
create index if not exists case_collaborators_case_idx on public.case_collaborators (case_id);

-- SECURITY DEFINER helpers avoid RLS recursion when policies reference these tables.
create or replace function public.is_case_collaborator(p_case_id uuid)
returns boolean language sql security definer stable set search_path = ''
as $$
  select exists (
    select 1 from public.case_collaborators cc
    where cc.case_id = p_case_id and cc.user_id = auth.uid()
  );
$$;
revoke execute on function public.is_case_collaborator(uuid) from anon;

create or replace function public.is_org_member_of_case(p_case_id uuid)
returns boolean language sql security definer stable set search_path = ''
as $$
  select exists (
    select 1 from public.cases c
    join public.profiles p on p.organization_id = c.organization_id
    where c.id = p_case_id and p.id = auth.uid()
  );
$$;
revoke execute on function public.is_org_member_of_case(uuid) from anon;

alter table public.case_collaborators enable row level security;

drop policy if exists "view collaborators" on public.case_collaborators;
create policy "view collaborators" on public.case_collaborators
  for select using (user_id = auth.uid() or public.is_org_member_of_case(case_id));

drop policy if exists "org admins/operators manage collaborators" on public.case_collaborators;
create policy "org admins/operators manage collaborators" on public.case_collaborators
  for all using (
    exists (select 1 from public.cases c join public.profiles p on p.organization_id = c.organization_id
            where c.id = case_collaborators.case_id and p.id = auth.uid() and p.role in ('admin','operator'))
  )
  with check (
    exists (select 1 from public.cases c join public.profiles p on p.organization_id = c.organization_id
            where c.id = case_collaborators.case_id and p.id = auth.uid() and p.role in ('admin','operator'))
  );

-- Let an invited doctor read the case, its invalidity details, certificates and contact.
drop policy if exists "Collaborators can view assigned cases" on public.cases;
create policy "Collaborators can view assigned cases" on public.cases
  for select using (public.is_case_collaborator(id));

drop policy if exists "Invited can view invalidity_details" on public.invalidity_details;
create policy "Invited can view invalidity_details" on public.invalidity_details
  for select using (public.is_case_collaborator(case_id));

drop policy if exists "Invited can view medical_certificates" on public.medical_certificates;
create policy "Invited can view medical_certificates" on public.medical_certificates
  for select using (public.is_case_collaborator(case_id));

drop policy if exists "Invited can add medical_certificates" on public.medical_certificates;
create policy "Invited can add medical_certificates" on public.medical_certificates
  for insert with check (public.is_case_collaborator(case_id));

drop policy if exists "Invited can view case contact" on public.contacts;
create policy "Invited can view case contact" on public.contacts
  for select using (
    exists (select 1 from public.cases c where c.contact_id = contacts.id and public.is_case_collaborator(c.id))
  );

-- Shared message board per case
create table if not exists public.case_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  author_id uuid references auth.users(id),
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);
create index if not exists case_messages_case_idx on public.case_messages (case_id, created_at);
alter table public.case_messages enable row level security;

drop policy if exists "view case messages" on public.case_messages;
create policy "view case messages" on public.case_messages
  for select using (public.is_org_member_of_case(case_id) or public.is_case_collaborator(case_id));

drop policy if exists "post case messages" on public.case_messages;
create policy "post case messages" on public.case_messages
  for insert with check (
    author_id = auth.uid() and (public.is_org_member_of_case(case_id) or public.is_case_collaborator(case_id))
  );

drop policy if exists "delete own case messages" on public.case_messages;
create policy "delete own case messages" on public.case_messages
  for delete using (author_id = auth.uid());

-- Structured requests operator <-> doctor
create table if not exists public.case_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  requested_by uuid references auth.users(id),
  assigned_to uuid references auth.users(id),
  title text not null check (length(trim(title)) > 0),
  details text,
  status text not null default 'open' check (status in ('open','in_progress','resolved','cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists case_requests_case_idx on public.case_requests (case_id, status);
alter table public.case_requests enable row level security;

drop policy if exists "view case requests" on public.case_requests;
create policy "view case requests" on public.case_requests
  for select using (public.is_org_member_of_case(case_id) or public.is_case_collaborator(case_id));

drop policy if exists "create case requests" on public.case_requests;
create policy "create case requests" on public.case_requests
  for insert with check (public.is_org_member_of_case(case_id) or public.is_case_collaborator(case_id));

drop policy if exists "update case requests" on public.case_requests;
create policy "update case requests" on public.case_requests
  for update using (public.is_org_member_of_case(case_id) or public.is_case_collaborator(case_id))
  with check (public.is_org_member_of_case(case_id) or public.is_case_collaborator(case_id));
