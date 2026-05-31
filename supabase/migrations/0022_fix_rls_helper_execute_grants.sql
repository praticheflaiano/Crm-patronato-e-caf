-- =====================================================================
-- Hotfix: restore EXECUTE on the RLS helper functions for `authenticated`.
--
-- Migration 0018 revoked EXECUTE on these SECURITY DEFINER helpers from
-- `authenticated`, intending only to hide them from the PostgREST RPC surface
-- ("RLS helpers are only used inside policies; revoke direct RPC access").
-- That reasoning is wrong: the helpers are called *inside* the RLS policies of
-- contacts, cases, documents, case_messages, case_requests, case_collaborators,
-- invalidity_details and medical_certificates. RLS policy expressions are
-- evaluated as the querying role (`authenticated`), so that role MUST be able
-- to execute them. Without the grant, every read on those tables fails with:
--     permission denied for function is_case_collaborator
--
-- The helpers only report on the *calling* user's own access (they filter by
-- auth.uid() internally), so granting EXECUTE is not a data-exposure risk.
-- `get_doctor_assigned_cases` is referenced by no policy and called by no app
-- code, so it intentionally remains locked down.
-- =====================================================================

grant execute on function public.is_case_collaborator(uuid) to authenticated;
grant execute on function public.is_org_member_of_case(uuid) to authenticated;

-- anon must never reach these helpers.
revoke execute on function public.is_case_collaborator(uuid) from anon, public;
revoke execute on function public.is_org_member_of_case(uuid) from anon, public;
