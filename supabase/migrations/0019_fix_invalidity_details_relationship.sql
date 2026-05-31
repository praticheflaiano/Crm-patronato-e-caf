-- Fix: PostgREST could not embed invalidity_details into cases because TWO FK
-- relationships existed (invalidity_details.case_id -> cases, and the redundant
-- cases.invalidity_details_id -> invalidity_details). This caused the error
-- "Could not embed because more than one relationship was found for 'cases'
-- and 'invalidity_details'" on the Invalidità Civile page.
--
-- The 1:1 link is already guaranteed by invalidity_details.case_id UNIQUE,
-- so the redundant column is dropped. Applied and verified on the remote DB.
alter table public.cases drop column if exists invalidity_details_id;
