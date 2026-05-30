-- 0007_advanced_rls_policies.sql
--
-- NOTE: a previous version of this file created policies that compared
-- `organization_id = auth.uid()` (an organization id can never equal a user id),
-- so they never matched and, being permissive (OR) SELECT policies, they could not
-- restrict access either. It also referenced a `doctor_id` column that does not
-- exist on `cases`. Organization isolation is already enforced correctly by the
-- per-organization policies created in 0004_profiles_organizations_roles.sql.
--
-- This migration is now idempotent and simply removes those broken policies if a
-- prior deploy created them. Fine-grained role scoping (collaborators limited to
-- assigned cases, doctors limited to their invalidità cases) is intentionally
-- deferred to a dedicated, tested iteration so it does not lock operators out.

drop policy if exists "Collaboratori: solo pratiche assegnate" on cases;
drop policy if exists "Medici: solo pratiche di invalidità" on cases;
drop policy if exists "Task: visibilità basata su pratiche" on tasks;
