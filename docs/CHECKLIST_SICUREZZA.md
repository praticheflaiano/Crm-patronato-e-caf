# Checklist Sicurezza Avanzata

Questa checklist definisce le best practices e le regole di sicurezza implementate e da mantenere nel CRM Centro Pratiche Flaiano.

## 1. Autenticazione (Auth)
- [ ] **Nessun Service Role nel Frontend**: La chiave `service_role` non deve MAI essere esposta o utilizzata lato client (es. React components). Utilizzarla esclusivamente lato server per operazioni di override mirate.
- [ ] **Chiavi Pubbliche con Prefisso**: La chiave anonima di Supabase deve essere sempre prefissata con `NEXT_PUBLIC_` (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- [ ] **Validazione Utenti Pending**: Ogni nuovo utente viene registrato con stato `pending` e non ha un `organization_id` associato (migrazioni 0020 e 0021). Gli admin devono approvare manualmente.

## 2. Row Level Security (RLS)
- [ ] **RLS Obbligatoria**: RLS deve essere abilitata su TUTTE le tabelle del database e non deve mai essere disabilitata, neanche per aggirare temporaneamente errori.
- [ ] **Isolamento Multi-Tenant**: Ogni tabella operativa (contatti, pratiche, documenti, task, note, certificati medici) deve includere il campo `organization_id`.
- [ ] **Verifica UPDATE via RLS**: Le policy di `UPDATE` devono includere una clausola `WITH CHECK` che replichi o restringa le condizioni della clausola `USING` per impedire modifiche non autorizzate a campi protetti.
- [ ] **Nessuna Ricorsione nelle Policy**: Attenzione a errori come il 42P17. Utilizzare funzioni helper (`security definer`) come `current_user_org_id()` invece di interrogare direttamente `profiles` all'interno delle policy di `profiles` stessa.
- [ ] **Assegnazioni FK ai Profili**: Le chiavi esterne per le relazioni utente (es. `user_id`) dovrebbero referenziare `public.profiles(id)` invece di `auth.users(id)` per permettere join fluidi via PostgREST.

## 3. Storage dei Documenti
- [ ] **Bucket Privato**: Il bucket `documents` di Supabase Storage deve essere configurato come privato.
- [ ] **RLS su Storage**: L'accesso al bucket `documents` (sia per lettura che scrittura) è limitato ai membri dell'organizzazione proprietaria della pratica, determinato tramite il prefisso della path (`{case_id}/`).
- [ ] **Signed URLs**: Il download di file sensibili dal backend deve avvenire tramite l'utilizzo di temporary signed URLs.

## 4. API Routes e Server Actions
- [ ] **Prevenzione Open Redirect**: Utilizzare sempre l'utility `getSafeRedirect` (in `src/utils/url.ts`) quando si gestiscono parametri utente come `redirect_to`.
- [ ] **Limitazioni e Validazioni API**: L'endpoint `/api/chat` deve avere rate limiting (best-effort) e controlli stretti per limitare abusi sui costi (es. numero e lunghezza dei messaggi) (vedi `/api/chat/route.ts`).
- [ ] **Verifica Permessi Lato Server**: Oltre all'RLS su Supabase, le Server Actions e API routes devono sempre verificare che l'utente sia autenticato (tramite `createClient()`) prima di eseguire logiche di business.

## 5. Edge Functions
- [ ] **Limitazione Batch Size**: Quando si processano embeddings per RAG (es. con il modello `gte-small`), impostare dimensioni dei batch limitate (max 4-8 elementi). Questo previene la terminazione improvvisa dovuta all'errore `HTTP 546 WORKER_RESOURCE_LIMIT` dovuto ai vincoli di memoria sulle Edge Functions di Supabase.

## 6. Access Control per Ruoli (RBAC)
- [ ] **Admin/Operator**: Hanno accesso a tutti i dati all'interno della propria organizzazione.
- [ ] **Collaborator**: Può accedere solo alle pratiche (cases/tasks) che gli sono state esplicitamente assegnate.
- [ ] **Doctor**: Può accedere solo ai casi medici e ai certificati di cui è stato nominato assegnatario, gestiti via `case_collaborators`.
- [ ] **Assistente AI Privacy**: Il chatbot AI (OpenRouter / RAG) opera con le stesse restrizioni RLS dell'utente corrente. Non deve fornire dati a cui l'utente non ha accesso.
