-- 0010_tari_module.sql
-- Enable the TARI Roma/AMA module inside the existing CRM

-- Add the new case type to the enum used by cases.type
ALTER TYPE case_type ADD VALUE IF NOT EXISTS 'tari';

-- Keep the migration idempotent for the existing schema style
-- TARI does not require a new sidecar table in this first integration:
-- the CRM reuses cases, documents, tasks, contacts, and the existing
-- authenticated Supabase storage layer.
