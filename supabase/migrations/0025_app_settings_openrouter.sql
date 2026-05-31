-- =====================================================================
-- Per-organization application settings (currently the OpenRouter API key
-- for the AI assistant), configurable from the in-app admin Settings page.
--
-- Admin-only via RLS. The key is read server-side by the chat route (using the
-- service-role client when available) so operators can use the assistant
-- without ever being able to read the raw key from the client.
-- =====================================================================

create table if not exists public.app_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  openrouter_api_key text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.app_settings enable row level security;

-- Only active admins of the owning organization may read or write settings.
drop policy if exists "Admins manage app settings" on public.app_settings;
create policy "Admins manage app settings" on public.app_settings
  for all
  using (public.is_active_admin() and organization_id = public.current_user_org_id())
  with check (public.is_active_admin() and organization_id = public.current_user_org_id());

-- RLS gates the rows; non-admins match no policy and therefore see nothing.
grant select, insert, update on public.app_settings to authenticated;
revoke all on public.app_settings from anon;

drop trigger if exists app_settings_updated_at on public.app_settings;
create trigger app_settings_updated_at
  before update on public.app_settings
  for each row execute procedure public.update_updated_at_column();
