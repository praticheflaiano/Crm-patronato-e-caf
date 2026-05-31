-- =====================================================================
-- Restore a self-update RLS policy on profiles.
--
-- Migration 0021 hardened profiles (REVOKE table-level INSERT/UPDATE, leaving
-- only a column-level UPDATE grant on full_name) but left no UPDATE policy.
-- With RLS enabled and no UPDATE policy, every UPDATE is denied — so even
-- saving one's own display name from /settings failed ("Salvataggio non
-- riuscito").
--
-- A user may update only their OWN row. Privilege escalation stays impossible
-- because the column-level grant allows writing only `full_name`; role /
-- organization_id / status remain unwritable by the client and are changed
-- solely via the security-definer approve_member() function.
-- =====================================================================

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());
