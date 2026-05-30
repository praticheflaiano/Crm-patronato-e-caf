-- Pin a non-mutable search_path on helper functions (security advisor 0011)
-- and remove RPC exposure of the internal event-trigger function (advisors 0028/0029).

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_current_user_organization_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.organization_id is null then
    select organization_id
    into new.organization_id
    from public.profiles
    where id = auth.uid();
  end if;
  return new;
end;
$$;

-- rls_auto_enable() is an internal event-trigger helper; it must not be callable via the API.
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
