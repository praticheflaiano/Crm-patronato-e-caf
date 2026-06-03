# Progresso CRM Patronato e CAF

Ultimo aggiornamento: 2026-06-03

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

- Nuovo helper `src/lib/ai-context.ts` (`buildCaseContext`): legge le pratiche
  con il **client autenticato** del chiamante, quindi **la RLS si applica** —
  l'assistente vede solo le pratiche che l'utente è autorizzato a vedere.
- Riassunto compatto (max 40 pratiche, max 3 scadenze aperte ciascuna): titolo,
  cittadino, tipo, stato, scadenze aperte. **Nessun dato clinico/diagnosi**
  (solo metadati amministrativi), coerente col vincolo "mai diagnosi mediche".
- La rotta `/api/chat` inietta il contesto nel system prompt dopo
  l'autenticazione. Sostituisce il vecchio placeholder RAG.
- Verificato in produzione (query RLS impersonata): restituisce le pratiche reali
  dell'organizzazione. lint/build/type-check/test verdi (124).

## Selezione modello OpenRouter dall'app (2026-05-31)

Esteso il pannello Impostazioni → Assistente AI: oltre alla chiave, l'admin può
scegliere il **modello** OpenRouter.

- `0026_app_settings_openrouter_model.sql`: colonna `openrouter_model` su
  `app_settings` (NULL = usa il default del server).
- Form: campo modello con datalist di **modelli gratuiti** suggeriti (id che
  finisce in `:free`) e link a openrouter.ai/models?max_price=0; accetta
  qualsiasi id incollato. Checkbox per rimuovere la chiave; lasciare la chiave
  vuota ora **non** la cancella più (si può cambiare solo il modello).
- Rotta chat: risolve il modello con priorità modello-app → `OPENROUTER_MODEL`
  → default gratuito `deepseek/deepseek-chat-v3-0324:free`.

## Chiave OpenRouter configurabile dall'app (2026-05-31)

Richiesta: poter inserire la chiave OpenRouter dall'interfaccia admin invece che
solo come variabile d'ambiente.

- Nuova tabella `app_settings` (una riga per organizzazione) con
  `openrouter_api_key`, RLS **solo-admin** dell'organizzazione
  (`0025_app_settings_openrouter.sql`, applicata al remoto e versionata).
- Pagina **Impostazioni → Assistente AI (OpenRouter)** (solo admin): form per
  salvare/rimuovere la chiave (`updateOpenRouterKey` server action). La chiave è
  scritta lato server e **non viene mai restituita al client** (il campo mostra
  solo lo stato: salvata nell'app / da variabile d'ambiente / non configurata).
- La rotta chat risolve la chiave lato server con priorità: chiave dell'app
  (letta via service-role così funziona per tutti i membri, non solo admin) →
  variabile d'ambiente `OPENROUTER_API_KEY`. Gli operatori non possono leggere
  la chiave (RLS solo-admin), ma possono usare l'assistente.
- Verificato in produzione: upsert admin tramite policy OK; build/lint/type-check
  verdi.

## Hotfix produzione: salvataggio profilo bloccato (2026-05-31)

In Impostazioni non era possibile salvare nemmeno il nome profilo
("Salvataggio non riuscito").

**Causa reale (drift del DB)**: la policy di self-update su `profiles` esisteva
già (`0004`, "Users can update their own profile") e la migrazione `0021`
*conteneva* il grant di colonna `grant update (full_name) ... to authenticated`
(riga ~37), ma sul database di produzione quel grant **non era presente**:
`authenticated` non aveva alcun privilegio UPDATE, quindi la policy permetteva la
riga ma il controllo dei privilegi SQL falliva comunque.

**Fix**:
- `0023_profiles_self_update_policy.sql` — primo tentativo, ipotizzava una policy
  mancante (ipotesi errata): ha solo aggiunto una policy duplicata, innocua.
- `0024_profiles_grant_update_fullname.sql` — fix vero: ri-concede
  `update (full_name)` ad `authenticated` (idempotente) e rimuove la policy
  duplicata di `0023`. Applicata al remoto e versionata.

L'escalation resta impossibile: solo `full_name` è scrivibile; ruolo/
organizzazione/stato non hanno grant di colonna e si cambiano solo via
`approve_member()`. Verificato in produzione con update impersonato della riga
reale (ritorna la riga aggiornata; il tentativo di cambiare `role` viene negato
con insufficient_privilege).

Nota: il pannello "Stato configurazione" (OpenRouter, service role) è di sola
diagnostica — riporta solo se la chiave è presente. La chiave OpenRouter è la
variabile d'ambiente `OPENROUTER_API_KEY` (impostata su Vercel), non
configurabile dall'interfaccia.

## Hotfix produzione: permission denied is_case_collaborator (2026-05-31)

Subito dopo la pubblicazione, la produzione mostrava
`Errore nel caricamento dei contatti: permission denied for function
is_case_collaborator` (e un errore di autenticazione collegato).

**Causa**: la migrazione `0018` aveva revocato `EXECUTE` sugli helper RLS
`is_case_collaborator` / `is_org_member_of_case` anche da `authenticated`,
pensando di nasconderli solo dal endpoint RPC PostgREST. Ma sono funzioni
`SECURITY DEFINER` chiamate **dentro** le policy RLS di contacts, cases,
documents, case_messages, case_requests, case_collaborators, invalidity_details
e medical_certificates; le policy vengono valutate come ruolo `authenticated`,
che quindi deve poterle eseguire. Senza il grant, ogni lettura falliva.

**Fix** (`0022_fix_rls_helper_execute_grants.sql`, applicata al remoto e
versionata): `grant execute ... to authenticated` su entrambi gli helper,
mantenendo il revoke da `anon`/`public`. Gli helper riportano solo l'accesso
del chiamante (filtrano per `auth.uid()`), quindi nessuna esposizione dati.
`get_doctor_assigned_cases` resta bloccata (non usata da policy né dall'app).

Verificato in produzione impersonando l'admin con ruolo `authenticated`: la
lettura di `contacts` ora restituisce le righe invece di "permission denied".

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

**Progetto Completato**
Tutti gli obiettivi operativi sono stati completati con successo:
1. Consolidato RLS avanzata per collaboratori, medici e moduli verticali.
2. Collegata knowledge base/RAG ufficiale per TARI e altri servizi.
3. Aggiunto import CSV e checklist sicurezza avanzata.

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
