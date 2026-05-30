# Changelog

Tutte le modifiche rilevanti a questo progetto sono documentate in questo file.

Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/),
e il progetto adotta il [Versionamento Semantico](https://semver.org/lang/it/).

---

## [Non rilasciato]

### Aggiunto

- **Ricerca globale**: componente `GlobalSearch` e API route `/api/search` per cercare contatti e pratiche in tempo reale da qualsiasi schermata.
- **Export CSV contatti**: endpoint `/api/contacts/export` e pulsante di download sulla pagina lista contatti.
- **Export CSV pratiche**: endpoint `/api/cases/export` e pulsante di download sulla pagina lista pratiche.
- **Pagina Impostazioni / Profilo** (`/settings`): modulo per aggiornare nome, email e preferenze utente; gestito tramite Server Action in `actions.ts`.
- **Sistema notifiche toast**: componente `Toast` con varianti `success`, `error`, `warning`, `info`; API route `/api/notifications`; attributo `aria-live="polite"` per l'accessibilità.
- **Skeleton di caricamento**: file `loading.tsx` in `cases/`, `contacts/`, `tasks/` e alla radice dell'app per una transizione visiva durante il fetching.
- **Pagina 404 personalizzata**: file `not-found.tsx` a livello di root con link di ritorno alla dashboard.
- **Manifest PWA**: file `manifest.ts` che dichiara nome, icone e `display: standalone` per l'installazione come app sul dispositivo.
- **Test unitari (Jest + React Testing Library)**: suite iniziale in `src/lib/__tests__/` che copre la logica di workflow degli stati pratica e le utilità TARI.

### Sicurezza

- **Storage documenti scoped per organizzazione** (`0013_storage_documents_org_scoped_rls.sql`): il bucket privato `documents` non è più accessibile a qualsiasi utente autenticato. Le policy RLS limitano lettura, scrittura, aggiornamento ed eliminazione ai soli membri dell'organizzazione proprietaria della pratica, derivata dal prefisso `{case_id}/` del path.
- **Hardening funzioni DB** (`0014_security_hardening_functions.sql`): `search_path` fissato su `update_updated_at_column` e `set_current_user_organization_id`; revocato il privilegio `EXECUTE` su `rls_auto_enable` per i ruoli `anon`, `authenticated` e `public`.
- **Rate limiting assistente AI**: l'endpoint `/api/chat` include validazione input (numero e lunghezza messaggi) e un rate limiting best-effort per utente per contenere costi e abusi sull'API OpenRouter.

### Migliorato

- **Accessibilità — skip-link**: aggiunto il collegamento "Salta al contenuto" visibile a focus nel layout globale, per la navigazione da tastiera.
- **Accessibilità — aria-live**: i messaggi di stato dinamici (notifiche, errori form) espongono `aria-live="polite"` per i lettori di schermo.

---

## [0.5.0] — 2026-05-26

### Aggiunto

- **Modulo TARI Roma/AMA**: portale consultivo `/tari` con fonti ufficiali AMA Roma e Roma Capitale; scheda operativa `/tari/[id]` con documenti, task, cambio stato e fonti collegate; workflow per attivazione, variazione, cessazione, riduzioni, esenzioni, rimborsi e contestazioni; checklist documentale e mappatura moduli AMA.
- **Assistente AI OpenRouter**: chat integrata (`/chat`) collegata a OpenRouter tramite Vercel AI SDK; modello predefinito `minimax/minimax-m2.7`.
- Migrazione `0010_tari_module.sql`: aggiunge `tari` all'enum `case_type` nel database Supabase remoto.

---

## [0.4.0] — 2026-05-23

### Aggiunto

- Layout mobile con shell autenticata responsive e sidebar collassabile.
- Route `/access` per bypass admin con password (uso esclusivamente interno).
- Callback OAuth/magic-link (`/auth/callback`).

### Migliorato

- Middleware autenticazione: sostituzione `getUser()` con controllo cookie SSR per latenza ridotta.
- Gestione errori API: tipi `auth`, colori chat, testo certificati medici.

---

## [0.3.0] — 2026-05-22

### Aggiunto

- **Modulo Invalidità Civile**: lista, dettaglio e creazione guidata pratiche (`/invalidita-civile`); dashboard medico (`/medico/dashboard`); certificati medici collegati alle pratiche (`medical_certificates`).
- **Sistema notifiche e task**: API `/api/tasks`, tabelle `tasks` e `task_notes` con RLS (`0011_task_notes.sql`, `0012_rls_task_notes.sql`).
- Build e lint verificati; fix errori TypeScript.

---

## [0.2.0] — 2026-05-22 (ante)

### Aggiunto

- Workflow stati pratiche con label e badge (`lib/case-workflow.ts`).
- Upload e download documenti privati su bucket Supabase Storage (`documents`) con URL firmati.
- Progresso operativo documentato in `docs/PROGRESSO.md`.

---

## [0.1.0] — 2026-05-22 (base)

### Aggiunto

- Setup iniziale Next.js 16 + Supabase SSR.
- Autenticazione email/password con Supabase Auth.
- CRUD completo contatti e pratiche.
- Multi-organizzazione tramite `organization_id`; RLS attiva.
- Profili, organizzazioni e ruoli (`admin`, `operator`, `collaborator`, `doctor`).
- Configurazione deploy Vercel, GitHub Actions CI, `.env.example`.
