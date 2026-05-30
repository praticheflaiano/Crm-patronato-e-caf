-- Lightweight, trigger-based audit trail for sensitive operational tables.
-- Org-scoped and immutable from the client (writes happen only via a SECURITY DEFINER trigger).

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  table_name text not null,
  record_id uuid,
  action text not null,
  actor_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_org_created_idx on public.audit_log (organization_id, created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists "Org members can read audit log" on public.audit_log;
create policy "Org members can read audit log"
on public.audit_log for select
using (organization_id in (select organization_id from public.profiles where id = auth.uid()));

create or replace function public.record_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_record uuid;
begin
  if (tg_op = 'DELETE') then
    v_org := old.organization_id;
    v_record := old.id;
  else
    v_org := new.organization_id;
    v_record := new.id;
  end if;

  if v_org is not null then
    insert into public.audit_log (organization_id, table_name, record_id, action, actor_id)
    values (v_org, tg_table_name, v_record, tg_op, auth.uid());
  end if;

  if (tg_op = 'DELETE') then
    return old;
  end if;
  return new;
end;
$$;

revoke execute on function public.record_audit() from anon, authenticated, public;

drop trigger if exists audit_cases on public.cases;
create trigger audit_cases after insert or update or delete on public.cases
  for each row execute function public.record_audit();

drop trigger if exists audit_contacts on public.contacts;
create trigger audit_contacts after insert or update or delete on public.contacts
  for each row execute function public.record_audit();

drop trigger if exists audit_documents on public.documents;
create trigger audit_documents after insert or update or delete on public.documents
  for each row execute function public.record_audit();
