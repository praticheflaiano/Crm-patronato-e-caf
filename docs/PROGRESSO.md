# Progresso CRM Patronato e CAF

Ultimo aggiornamento: 2026-06-01

## Aggiunta Importazione Pratiche da CSV (2026-06-01)
- Creata la pagina `/cases/import` per caricare file CSV con le anagrafiche pratiche in blocco.
- Creata un'azione `importCases` in `src/app/cases/import/actions.ts` che esegue il parsing del CSV per inserire pratiche associate a un contatto e collegate tramite un campo `fiscal_code`.
- Aggiornata la pagina `src/app/cases/page.tsx` con un pulsante "Importa CSV".

## Aggiunta Documento Checklist di Sicurezza (2026-06-01)
- Creato `docs/CHECKLIST_SICUREZZA.md` come da direttive. Contiene regole di sicurezza su Auth, RLS, Storage, API Routes ed Edge Functions.

## Hotfix: Edge Function embed WORKER_RESOURCE_LIMIT (2026-05-31)

In produzione la sezione Conoscenza mostrava "Embedding non riuscito: Edge
Function returned a non-2xx status code". Riprodotto chiamando direttamente la
funzione: con un batch di 20 testi restituiva HTTP 546 `WORKER_RESOURCE_LIMIT`
(il modello gte-small è pesante in memoria sul runtime edge). Batch piccoli
(3-6) → HTTP 200 in <1s.

**Fix**:
- App: `EMBED_BATCH` ridotto da 20 a 4 in `/api/knowledge` (l'indicizzazione
  invia più batch piccoli con margine ampio).
- Edge Function `embed` v2: cap difensivo a max 8 input per chiamata (oltre →
  400 pulito invece di crash). Sorgente ora versionata in
  `supabase/functions/embed/index.ts`.
- Verificato end-to-end: 5 batch consecutivi da 4 → tutti HTTP 200 (~0.6-1s);
  batch da 12 → 400. lint/build/test verdi (124).

## Memoria chat su database (2026-05-31)

Completata la fase finale: la cronologia della chat è salvata sul database (per
utente, RLS), quindi **segue l'utente su qualsiasi dispositivo** invece di
restare nel browser.

- Nuova rotta `/api/chat/history`: GET (carica l'ultima conversazione + messaggi,
  crea-on-demand lato client), POST `{action:'new'}` (nuova conversazione),
  DELETE (cancella tutta la cronologia dell'utente).
- `/api/chat`: accetta `conversationId`, salva il messaggio utente prima dello
  stream e la risposta dell'assistente in `onFinish` (best-effort, non blocca
  mai la chat); restituisce l'id conversazione nell'header `x-conversation-id`.
- Pagina `/chat`: carica la cronologia dal DB all'avvio (sostituisce
  localStorage come fonte primaria), invia `conversationId` con ogni messaggio,
  "Nuova chat" azzera e apre una nuova conversazione.
- Verificato end-to-end sul remoto sotto RLS (conversazione + messaggi creati e
  riletti, rolled back). lint/build/type-check/test verdi (124).

## Knowledge base + RAG + memoria chat su DB — Fase 1/2/3 (2026-05-31)

Implementato il motore RAG e la sezione Conoscenza richiesti.

### Motore embedding (gratuito, senza chiave)
- Edge Function Supabase `embed`: modello integrato `gte-small` (384 dim),
  nessuna API key, gira sull'infrastruttura Supabase. JWT obbligatorio.
- pgvector 0.8.0 (già installato) per la ricerca di similarità.

### Schema (`0027_knowledge_base_and_chat_memory.sql`)
- `knowledge_documents` + `knowledge_chunks` (con `embedding vector(384)` e
  indice HNSW cosine), RLS per organizzazione.
- `match_knowledge_chunks()`: ricerca per similarità, hard-scoped
  `current_user_org_id()` (niente leak cross-org). Verificata end-to-end sul
  remoto (match a similarità 1.000, dati di test rolled back).
- `chat_conversations` + `chat_messages` per la memoria chat su DB (RLS per
  utente). [Cablaggio UI della cronologia server-side: prossima iterazione.]

### Sezione Conoscenza (`/knowledge`)
- Upload PDF / Word (.docx) / testo (estrazione con pdf-parse v2 e mammoth) +
  incolla-testo; chunking con overlap; embedding e indicizzazione via API
  `/api/knowledge`. Elenco con stato (indicizzato/elaborazione/errore) ed
  eliminazione. Voce di menu "Conoscenza".

### RAG nella chat
- `/api/chat` ora recupera i frammenti più pertinenti alla domanda
  (`buildKnowledgeContext`: embed query → `match_knowledge_chunks`) e li inietta
  nel system prompt come fonte prioritaria, con citazione della fonte.

Nota: l'estrazione testo da PDF in serverless è l'unico punto non testabile
end-to-end da qui (richiede file reali) — collaudo finale upload sull'app.
Memoria chat: le tabelle sono pronte; la chat resta per ora persistente lato
browser (localStorage) finché non si collega la cronologia server-side.

## Memoria della chat AI (2026-05-31)

La conversazione con l'assistente si svuotava uscendo dalla sezione (viveva solo
nello stato React). Ora è **persistente**:

- La pagina `/chat` salva la conversazione in `localStorage` (chiave
  `caf-assistant-chat-v1`) e la ripristina al rientro o al ricaricamento.
- `useChat` viene inizializzato con i messaggi salvati; il salvataggio avviene
  quando lo stream è concluso (turni completi), non a metà risposta.
- Pulsante **"Nuova chat"** per azzerare la conversazione; auto-scroll all'ultimo
  messaggio.
- Persistenza **solo lato browser** (nessun salvataggio sul server), così il
  contesto delle pratiche non viene archiviato nel backend.

## Assistente AI con accesso alle pratiche (2026-05-31)

L'assistente AI ora risponde sui dati reali invece che "alla cieca".

- `/api/chat` (Server) inietta nel *system prompt* le pratiche attive e recenti
  dell'organizzazione. lint/build/type-check/test verdi (124).

## Selezione modello OpenRouter dall'app (2026-05-31)

L'amministratore può ora scegliere il modello LLM direttamente dall'app.

- `0026_app_settings_openrouter_model.sql`: colonna `openrouter_model` su
  `organizations`. Applicata al remoto e versionata.
- Aggiornata la pagina `/settings` (UI + action) per mostrare una select con i
  modelli disponibili (DeepSeek, Claude 3.5, Llama 3, ecc.).
- `/api/chat` ora legge dinamicamente il modello selezionato e lo passa all'AI
  → default gratuito `deepseek/deepseek-chat-v3-0324:free`.

## Chiave OpenRouter configurabile dall'app (2026-05-31)

L'amministratore può ora inserire la propria chiave API OpenRouter in modo
sicuro direttamente dalla pagina Impostazioni, senza toccare `.env`.

- Estesa la tabella `organizations` con colonna crittografata `openrouter_key`
  (`0025_app_settings_openrouter.sql`, applicata al remoto e versionata).
- Aggiornata la pagina `/settings` (UI + action) per salvare la chiave e
  mostrare un placeholder `sk-or-v1-••••••••` (mai in chiaro).
- `/api/chat` ora tenta di recuperare la chiave dal DB per l'organizzazione; se
  manca, usa il fallback env `OPENROUTER_API_KEY` (per dev/emergenza).

## Hotfix produzione: salvataggio profilo bloccato (2026-05-31)

In produzione un utente loggato provava ad aggiornare il suo profilo ma otteneva
sempre "Permesso negato". Causa: la policy RLS iniziale di Supabase Auth c'era
già (`0004`, "Users can update their own profile") e la migrazione `0021`
aveva brutalmente rimosso i grant `UPDATE` limitandoli alla sola funzione admin
`approve_member()`. Risultato: utente owner passava la RLS ma falliva il grant
di tabella.

**Fix**:
- `0023_profiles_self_update_policy.sql` — primo tentativo, ipotizzava una policy
  mancante, ma il vero problema era il grant.
- `0024_profiles_grant_update_fullname.sql` — fix vero: ri-concede
  `UPDATE(full_name)` al ruolo `authenticated`. Contiene anche il drop della policy
  duplicata di `0023`. Applicata al remoto e versionata.
- L'utente normale ora può tornare a modificare il proprio nome; i campi
  `role`/`status`/`organization_id` restano protetti dal database.

## Hotfix produzione: permission denied is_case_collaborator (2026-05-31)

In produzione la dashboard medico restituiva HTTP 500 "permission denied for
function is_case_collaborator". Causa: la migrazione `0014` aveva revocato
(giustamente) `EXECUTE` da `public/anon/authenticated` per **tutte** le funzioni
nel DB al fine di isolare `rls_auto_enable`, ma aveva bloccato inavvertitamente
le funzioni helper (security definer) che le policy RLS richiamano internamente
con i permessi dell'utente corrente.

**Fix** (`0022_fix_rls_helper_execute_grants.sql`, applicata al remoto e
versionata):
- Ri-concesso `EXECUTE` esplicito a `authenticated` (ma **NON** ad anon) per le 3
  funzioni RLS chiave:
  - `is_active_admin()`
  - `current_user_org_id()`
  - `is_case_collaborator()`

## Completamento funzionale pre-pubblicazione (2026-05-31)

- Modulo collaborazioni/medici rinforzato:
  - Visualizzazione delle richieste di collaborazione in attesa.
  - Fix alle policy RLS in `0018`: la logica OR che mescolava controlli admin
    (bypassing role=collaborator/doctor) ed estensioni di permesso, combinata
    con vincoli su `assigned_to` isolati per ruolo, causava rigetto ricorsivo (403)
    o visibilità anomala in certi contesti. Ora le policy sono state scritte
    come OR semplici e puliti in base al ruolo dell'utente corrente restituito da
    `profiles.role` tramite helper definer. Questo consente una chiara separazione
    tra quello che vede l'admin/operator e quello che vede un collaboratore assegnato.
  - Fix a `medical_certificates`: policy RLS per update/insert/delete corrette.
  - Implementazione completa UI/API dei messaggi di collaborazione.
- Audit Log (Registro Attività):
  - Creata UI in `/audit` e API route dedicata con action type/timestamp.
- Validazione end-to-end:
  - Tutti i workflow completati (incluso caricamento referti).
  - Test suite unit passanti (124). Type check passante. Linter verde.

## Risultato
`npm run lint` ✅ · `npm run build` ✅ (type-check incluso) · `npm test` ✅ 124/124.

## Sprint sicurezza onboarding & multi-medico (2026-05-31)

### Approvazione manuale admin (Onboarding chiuso)

Per evitare che chiunque si iscriva (spesso con permessi rotti `null` che
causano errori RLS ricorsivi o fughe di dati), l'onboarding ora richiede
esplicitamente l'approvazione di un admin:

- DB:
  - Tabella `profiles` estesa con colonna `status` (`pending`, `active`,
    `suspended`).
  - La migrazione assegna lo stato `active` a tutti gli utenti storici prima di
    inserire il vincolo `NOT NULL`. Niente impatto sugli utenti attuali, che
    ti sono stati impostati su `active`.
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
10. Import CSV e checklist sicurezza avanzata. Completato.
11. Modulo TARI Roma/AMA. Integrato e migrazione `0010_tari_module.sql` applicata sul database remoto.

## Team agenti attivo

- Worker Pipeline: stati pratica, label, badge e flusso avanzamento. Integrato.
- Worker Documenti: upload su bucket `documents`, metadati e signed URL. Integrato.
- Worker UX CRUD: uniformare form e stati vuoti. Integrato.

## Prossimo obiettivo operativo

Integrare i risultati dei worker in questo ordine:

1. Consolidare RLS avanzata per collaboratori, medici e moduli verticali.
2. Collegare knowledge base/RAG ufficiale per TARI e altri servizi.

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
