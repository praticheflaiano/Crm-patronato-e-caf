# Progresso CRM Patronato e CAF

Ultimo aggiornamento: 2026-05-31

## Completamento funzionale pre-pubblicazione (2026-05-31)

Audit finale per rendere il CRM pienamente funzionante in ogni sua parte, prima
della pubblicazione in produzione.

### Assistente AI riparato (era completamente rotto)

La pagina chat usava la vecchia API di `useChat` (`input`, `handleInputChange`,
`handleSubmit`, `m.content`) mascherata con `as any`, ma il progetto monta
**AI SDK v6** (`ai@6`, `@ai-sdk/react@3`), dove quell'API non esiste più: a
runtime il campo di input era **non digitabile** e i messaggi si renderizzavano
**vuoti** → assistente del tutto inutilizzabile.

- Client (`src/app/chat/page.tsx`): riscritto sull'API v6 — `useChat()` con
  `sendMessage`/`status`, input gestito in locale, testo letto da `message.parts`.
- Server (`src/app/api/chat/route.ts`): i messaggi UI in arrivo ora passano per
  `convertToModelMessages()` e la risposta usa `toUIMessageStreamResponse()`
  (protocollo UI message stream), coerente col transport di default del client.
  Mantenuti auth, rate limiting e validazione input già presenti.

### Centro notifiche reso operativo

Il sistema notifiche aveva lettura/segna-letto/eliminazione e realtime completi,
ma **nessun punto dell'app creava notifiche** → la campanella restava sempre
vuota. Aggiunto helper best-effort `src/lib/notifications.ts` (`notifyUser`,
non blocca mai l'azione che lo scatena) e collegato agli eventi a destinatario
univoco del flusso medico:

- Invito di un medico a una pratica → notifica al medico.
- Nuova richiesta su una pratica → notifica al medico assegnato (no auto-notifica).

`organization_id` è impostato dal trigger esistente; la policy SELECT è per
`user_id`, quindi il medico vede la notifica anche se di organizzazione diversa.

### Verifiche

`npm run lint` ✅ · `npm run build` ✅ (type-check incluso) · `npm test` ✅ 124/124.

## Sprint sicurezza onboarding & multi-medico (2026-05-31)

### Approvazione account da parte dell'admin

In precedenza chiunque si registrava otteneva automaticamente un profilo
`operator` con accesso completo all'organizzazione, e qualsiasi utente
autenticato poteva modificare il proprio `role`/`organization_id` (escalation di
privilegi). Ora:

- Migrazioni `onboarding_*`:
  - Nuova colonna `profiles.status` (`pending` / `active` / `disabled`); i membri
    esistenti sono stati impostati su `active`.
  - `profiles.organization_id` reso nullable: un account in attesa non ha
    organizzazione, quindi tutte le policy `organization_id IN (...)` lo escludono
    automaticamente (nessuna riscrittura delle policy operative).
  - Trigger `on_auth_user_created` → `handle_new_user()`: ogni nuovo utente nasce
    `pending`, senza organizzazione e con ruolo minimo.
  - `REVOKE INSERT/UPDATE` sui campi sensibili di `profiles` (clienti possono
    aggiornare solo `full_name`). L'unico modo per assegnare ruolo/org/stato è la
    funzione `security definer` `approve_member()`, protetta da `is_active_admin()`.
- App:
  - `getOrCreateUserProfile` ora è in sola lettura ed espone `status`.
  - Layout: schermata `PendingApproval` per account in attesa o sospesi.
  - Nuova pagina admin `/admin/utenti` per approvare/rifiutare registrazioni e
    gestire ruoli e sospensioni.

### Più medici per pratica

La dashboard medico filtrava per la singola colonna `cases.doctor_id`, che veniva
sovrascritta a ogni invito: solo l'ultimo medico vedeva la pratica. Ora l'accesso
dei medici si basa sulla tabella `case_collaborators` (`role='doctor'`), coerente
con le policy RLS `is_case_collaborator`, così più medici possono collaborare sulla
stessa pratica. Modifiche solo applicative (nessuna migrazione).

### Correzioni post-review

- **Ricorsione RLS su `profiles`**: la prima versione della policy admin conteneva
  una subquery su `profiles` dentro una policy su `profiles` → errore 42P17 a ogni
  lettura del profilo da parte di un admin (quindi a ogni pagina, via il layout).
  Risolto con la funzione `security definer` `current_user_org_id()` (stesso schema
  di `is_case_collaborator`). La policy mostra ora anche gli utenti senza org
  (pending **e** disabled), così l'admin può riattivare gli account sospesi.
- **Migrazioni versionate**: lo stato applicato è ora nel repo in
  `supabase/migrations/0020_onboarding_member_status.sql` e
  `0021_onboarding_profile_hardening.sql` (idempotenti, stato finale corretto).
- Test unit `src/lib/__tests__/user-profile.test.ts` per `isActiveMember()`.

Ultimo aggiornamento precedente: 2026-05-30

## Sprint qualità & funzionalità (2026-05-30)

Questo sprint ha completato le funzionalità trasversali di qualità e la documentazione del progetto.

### Funzionalità aggiunte

- **Ricerca globale**: componente `GlobalSearch` con API route `/api/search`; ricerca in tempo reale su contatti e pratiche.
- **Export CSV**: endpoint `/api/contacts/export` e `/api/cases/export` con pulsanti di download nelle rispettive liste.
- **Pagina Impostazioni / Profilo** (`/settings`): aggiornamento nome, email e preferenze utente via Server Action.
- **Sistema notifiche toast**: varianti `success`, `error`, `warning`, `info`; API `/api/notifications`; supporto `aria-live="polite"`.
- **Skeleton di caricamento**: file `loading.tsx` in tutte le sezioni principali (dashboard, contatti, pratiche, task).
- **Pagina 404 personalizzata**: `not-found.tsx` con link di ritorno alla dashboard.
- **Manifest PWA**: `manifest.ts` per installazione come app sul dispositivo.
- **Test unitari**: suite Jest + React Testing Library in `src/lib/__tests__/` per workflow stati e utilità TARI.

### Sicurezza

- Storage documenti scoped per organizzazione (migrazione `0013`): accesso al bucket `documents` limitato ai soli membri dell'organizzazione proprietaria della pratica.
- Hardening funzioni DB (migrazione `0014`): `search_path` fissato, `EXECUTE` su `rls_auto_enable` revocato per ruoli pubblici.
- Rate limiting e validazione input sull'endpoint `/api/chat`.

### Migliorato

- Accessibilità: skip-link "Salta al contenuto" nel layout globale; `aria-live` sui messaggi di stato dinamici.
- Documentazione: `README.md` revisionato, `CHANGELOG.md` creato (formato Keep a Changelog), `PROGRESSO.md` aggiornato.

---

## Hardening sicurezza (2026-05-30)

- Verificato lo stato reale del database remoto: le policy RLS su `contacts`,
  `cases`, `documents`, `tasks`, `medical_certificates` sono gia correttamente
  isolate per `organization_id` tramite `profiles` (migrazione 0004). I file
  locali `0002` (permissivo) e `0007` (rotto) erano fuorvianti.
- `0013_storage_documents_org_scoped_rls.sql`: il bucket privato `documents`
  non e piu accessibile a ogni utente autenticato. Accesso (read/insert/update/
  delete) limitato ai membri dell'organizzazione proprietaria della pratica,
  derivata dal prefisso `{case_id}/` del path. Applicata e verificata sul remoto.
- `0014_security_hardening_functions.sql`: `search_path` fissato su
  `update_updated_at_column` e `set_current_user_organization_id`; revocato
  `execute` su `rls_auto_enable` da `anon/authenticated/public`. Applicata sul remoto.
- `0007_advanced_rls_policies.sql` riscritta: rimuove le policy non valide
  (`organization_id = auth.uid()`, colonna `doctor_id` inesistente) in modo
  idempotente. Lo scoping per ruolo (collaboratore/medico) e rinviato a una
  iterazione dedicata e testata per non bloccare gli operatori.
- Security advisor Supabase: da 6 a 2 warning residui (estensione `vector` in
  `public` e protezione password compromesse) — entrambi configurazioni a basso
  rischio, non bug applicativi.
- `/api/chat`: aggiunti validazione input (numero/lunghezza messaggi) e rate
  limiting best-effort per utente per contenere costi/abusi OpenRouter.

## Storico

Ultimo aggiornamento precedente: 2026-05-26

## Repository e ambiente

- Repository GitHub: `https://github.com/praticheflaiano/Crm-patronato-e-caf.git`
- Branch principale: `main`
- Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase SSR
- Progetto Supabase: `Crm-patronato-e-caf`
- Supabase ref: `xjchklrrmyavizozhtpb`
- URL locale: `http://127.0.0.1:3000`
- Account operativo admin: `praticheflaiano@gmail.com`

## Stato completato

### Setup e pubblicazione

- Progetto locale collegato al repository GitHub.
- Dipendenze installate.
- `.env.local` configurato localmente con URL Supabase e chiave pubblicabile.
- `.env.example` aggiunto al repository.
- Build e lint verificati piu volte.

### Supabase

- Migrazioni applicate:
  - `0001_initial_schema.sql`
  - `0002_rls_policies.sql`
  - `0003_documents_storage_bucket.sql`
  - `0004_profiles_organizations_roles.sql`
  - `0005_profile_self_setup.sql`
  - `0006_fix_profiles_rls_recursion.sql`
- Migrazioni TARI/task note applicate e verificate sul database remoto:
  - `0010_tari_module.sql` (aggiunge `tari` all'enum `case_type`)
  - `0011_task_notes.sql`
  - `0012_rls_task_notes.sql`
- Tabelle operative:
  - `organizations`
  - `profiles`
  - `contacts`
  - `cases`
  - `documents`
  - `tasks`
  - `task_notes`
  - `medical_certificates`
- Bucket privato Supabase Storage:
  - `documents`
- RLS attiva sulle tabelle principali.
- Organizzazione creata:
  - `Centro Pratiche Flaiano`
- Ruoli definiti:
  - `admin`
  - `operator`
  - `collaborator`
  - `doctor`
- Utente `praticheflaiano@gmail.com` configurato come `admin`.

### App

- Login Supabase funzionante.
- Layout autenticato con sidebar, organizzazione e ruolo utente.
- Dashboard con conteggi reali da Supabase.
- Lista, creazione, dettaglio e modifica contatti.
- Lista, creazione, dettaglio e modifica pratiche.
- Cambio stato pratica.
- Task e note pratica integrati lato UI/API, con tipi locali allineati.
- Modulo Invalidita Civile integrato.
- Modulo TARI Roma/AMA integrato come case type nativo (`tari`), con portale `/tari`, scheda dettaglio `/tari/[id]`, fonti ufficiali AMA/Roma Capitale, checklist documentale e mappatura moduli.
- Chat AI collegata a OpenRouter via Vercel AI SDK; modello predefinito `minimax/minimax-m2.7`. RAG non ancora implementato.
- Tema chiaro stabile: rimosso il dark mode automatico che rendeva la UI nera/illeggibile.

## Decisioni importanti

- Non usare `service_role` nel frontend.
- Usare `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; supporto legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` resta nel codice.
- RLS non va disattivata per aggirare errori.
- I documenti sanitari reali vanno caricati solo dopo permessi avanzati e controllo accessi medico/collaboratore.
- Il RAG sui documenti va fatto solo dopo filtri RLS robusti.
- L'assistente AI non deve fornire diagnosi mediche.

## Sequenza di lavoro approvata

1. Profili, organizzazione e ruoli. Completato.
2. CRUD completo contatti e pratiche. Base completata.
3. Pipeline pratiche e stati strutturati. Base completata.
4. Documenti con upload/download privato. Base completata.
5. Task e note. Base implementata; migrazioni remote applicate e verificate.
6. RLS avanzata per admin, operatori, collaboratori e medici. Da consolidare.
7. Modulo Invalidita Civile. Integrato; testare con dati reali e RLS avanzata.
8. Knowledge base. Da fare.
9. Assistente AI OpenRouter implementato; RAG protetto da fare.
10. Import CSV e checklist sicurezza avanzata. Da fare.
11. Modulo TARI Roma/AMA. Integrato e migrazione `0010_tari_module.sql` applicata sul database remoto.

## Team agenti attivo

- Worker Pipeline: stati pratica, label, badge e flusso avanzamento. Integrato.
- Worker Documenti: upload su bucket `documents`, metadati e signed URL. Integrato.
- Worker UX CRUD: uniformare form e stati vuoti. Integrato.

## Prossimo obiettivo operativo

Integrare i risultati dei worker in questo ordine:

1. Consolidare RLS avanzata per collaboratori, medici e moduli verticali.
2. Collegare knowledge base/RAG ufficiale per TARI e altri servizi.
3. Aggiungere import CSV e checklist sicurezza avanzata.

## Comandi di verifica

```bash
npm run lint
npm run build
```

In caso di errore `EPERM` su `.next` in Windows/OneDrive:

1. fermare il server Next locale;
2. rimuovere solo la cartella `.next` del progetto;
3. rilanciare `npm run build`.

## Ultimi commit rilevanti

- `6f60367` - Polish CRM core screens
- `d4bc0d2` - Add roles and core CRUD flows
- `ca343ac` - Add project progress memory
- `ff5ea33` - Add workflow and document handling
