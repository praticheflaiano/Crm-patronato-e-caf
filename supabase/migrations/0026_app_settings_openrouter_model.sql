-- =====================================================================
-- Let admins pick the OpenRouter model (not just the API key) from the in-app
-- Settings page. NULL means "use the server default / OPENROUTER_MODEL env var".
-- The chat route resolves: app model -> OPENROUTER_MODEL -> free default.
-- =====================================================================

alter table public.app_settings
  add column if not exists openrouter_model text;
