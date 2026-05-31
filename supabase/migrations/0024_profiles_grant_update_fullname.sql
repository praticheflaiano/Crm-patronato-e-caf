-- =====================================================================
-- True fix for "Salvataggio non riuscito" when editing the profile name.
--
-- The self-update RLS policy on profiles already existed (0004), and migration
-- 0021 *intended* to grant the narrow column privilege `UPDATE (full_name)` to
-- authenticated (0021 line ~37). However the live database had drifted and that
-- column grant was NOT present, so `authenticated` had no UPDATE privilege at
-- all: the RLS policy permitted the row but the SQL privilege check still
-- failed. Re-grant it explicitly (idempotent).
--
-- Escalation stays impossible: only full_name is writable; role /
-- organization_id / status have no column grant and are changed solely via the
-- security-definer approve_member() function.
-- =====================================================================

grant update (full_name) on public.profiles to authenticated;

-- 0023 added a self-update policy that duplicated the pre-existing 0004 policy
-- "Users can update their own profile"; drop the duplicate to keep things clean.
drop policy if exists "Users can update own profile" on public.profiles;
