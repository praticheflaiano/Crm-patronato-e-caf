-- Onboarding con approvazione admin (parte 2/2): hardening e gestione membri.
--
-- Chiude un'escalation di privilegi (qualunque utente autenticato poteva
-- impostare il proprio role/organization_id) e fornisce all'admin il solo
-- percorso consentito per concedere/revocare l'accesso. Idempotente.

-- 1. Ogni nuovo utente auth riceve un profilo PENDING, senza organizzazione e con
--    ruolo minimo. Esegue come definer per scavalcare RLS e i grant di colonna.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, organization_id, full_name, role, status)
  values (
    new.id,
    null,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'operator',
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Chiusura escalation: i client non possono scrivere role/organization/status.
--    Un GRANT a livello tabella scavalca i REVOKE di colonna, quindi si revoca a
--    livello tabella e si ri-concede solo la colonna che l'utente puo' cambiare.
--    I profili sono creati solo dal trigger; role/org/status solo da approve_member.
revoke insert on public.profiles from authenticated, anon;
revoke update on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;

-- 3. Helper SECURITY DEFINER (evitano la ricorsione RLS quando usati in policy su
--    profiles, come is_case_collaborator per le altre tabelle).
create or replace function public.is_active_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.status = 'active'
  );
$$;

create or replace function public.current_user_org_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

-- authenticated deve poter eseguire is_active_admin/current_user_org_id perche'
-- sono valutate dentro la policy sottostante; anon no.
revoke execute on function public.is_active_admin() from public, anon;
revoke execute on function public.current_user_org_id() from public, anon;

-- 4. Gli admin attivi vedono i membri della propria org piu' gli utenti senza org
--    (pending + disabled): entrambi questi stati hanno organization_id NULL.
drop policy if exists "Admins can view member profiles" on public.profiles;
create policy "Admins can view member profiles" on public.profiles
  for select using (
    public.is_active_admin()
    and (organization_id is null or organization_id = public.current_user_org_id())
  );

-- 5. Unico percorso per concedere/revocare l'accesso. Definer: scavalca i lock di
--    colonna, ma impone che il chiamante sia un admin attivo e assegna l'utente
--    all'org dell'admin. Disattivando si azzera l'org cosi' la RLS operativa nega.
create or replace function public.approve_member(
  target_id uuid,
  new_role public.user_role,
  new_status public.member_status
) returns void language plpgsql security definer set search_path = '' as $$
declare
  admin_org uuid;
begin
  if not public.is_active_admin() then
    raise exception 'Solo un amministratore attivo puo gestire i membri';
  end if;

  select organization_id into admin_org from public.profiles where id = auth.uid();

  update public.profiles
  set role = new_role,
      status = new_status,
      organization_id = case when new_status = 'active' then admin_org else null end,
      updated_at = now()
  where id = target_id;
end $$;

revoke all on function public.approve_member(uuid, public.user_role, public.member_status) from public, anon;
grant execute on function public.approve_member(uuid, public.user_role, public.member_status) to authenticated;
