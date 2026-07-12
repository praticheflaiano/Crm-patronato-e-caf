# Checklist Sicurezza CRM Patronato e CAF

Questa checklist documenta le misure di sicurezza implementate nel sistema, coprendo Autenticazione, RLS (Row Level Security), Storage, API Routes e Edge Functions.

## 1. Autenticazione (Auth)

- [x] I token JWT e le sessioni utente sono gestiti tramite Vercel AI SDK / Next.js e le utility di Supabase (`src/utils/supabase/*`).
- [x] Il ruolo utente e l'organizzazione di appartenenza sono definiti e protetti nella tabella `profiles`.
- [x] L'approvazione degli account è gestita manualmente dagli amministratori (`pending` -> `active`), con default gestiti nel trigger `handle_new_user()` (0021).

## 2. Row Level Security (RLS)

- [x] L'RLS è **obbligatoriamente attiva** su tutte le tabelle (0002).
- [x] Tutte le policy includono una condizione sull'`organization_id` legata al profilo utente per garantire il multi-tenant (0004 e successivi).
- [x] Le policy `UPDATE` utilizzano la clausola `WITH CHECK` per limitare modifiche non autorizzate su campi sensibili, e i campi sensibili in `profiles` hanno `revoke update` eccetto `full_name` (0021).

## 3. Storage

- [x] I bucket di Storage (es. `documents`) sono **privati** (0003).
- [x] L'accesso e la lettura dei file avvengono solo tramite **signed URLs**.
- [x] L'RLS sui bucket garantisce che solo i membri dell'organizzazione proprietaria (determinata dal path `case_id/...`) possano accedere ai file in lettura/scrittura (0013).

## 4. API Routes e Server Actions

- [x] Le API e le Server Actions verificano sempre l'autenticazione lato server (`await supabase.auth.getUser()`).
- [x] La Service Role Key di Supabase non viene mai passata al frontend e viene utilizzata unicamente in ambiti amministrativi limitati server-side (`src/utils/supabase/server.ts`).
- [x] I reindirizzamenti utilizzano un'utility (`getSafeRedirect`) per prevenire vulnerabilità di Open Redirect.

## 5. Edge Functions

- [x] Le Edge Functions validano le dimensioni del batch (es. per l'embedding tramite gte-small, limite max 8 input) per prevenire crash da limiti di memoria (`supabase/functions/embed/index.ts`).
- [x] Implementazione di policy RLS robuste e JWT su invocazioni.
