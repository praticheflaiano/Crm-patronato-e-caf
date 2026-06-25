# Checklist di Sicurezza del Sistema

Questa checklist contiene le best practice di sicurezza implementate nel progetto CRM per CAF/Patronato (Centro Pratiche Flaiano).
Deve essere seguita rigorosamente durante lo sviluppo e l'aggiunta di nuove funzionalità.

## 1. Supabase Auth
- [x] L'autenticazione è gestita esclusivamente tramite il client Supabase fornito (`src/utils/supabase/server.ts` e `src/utils/supabase/client.ts`).
- [x] La gestione del profilo utente (`public.profiles`) è legata tramite trigger (`on_auth_user_created`) alla creazione dell'utente in `auth.users`.
- [x] I nuovi account vengono creati con stato `pending` e senza permessi operativi, in attesa di approvazione da parte di un `admin`.
- [x] Il `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o `ANON_KEY`) può essere esposto sul client, mentre il `SUPABASE_SERVICE_ROLE_KEY` (se presente) **non deve mai** essere esposto al frontend o inviato al client.
- [x] Controlli RBAC rigorosi: solo 'admin' può approvare account o gestirne lo stato. 'collaborator' e 'doctor' hanno permessi ridotti e isolati.

## 2. Row Level Security (RLS)
- [x] RLS è **abilitata su tutte le tabelle** (`contacts`, `cases`, `documents`, `tasks`, `medical_certificates`, ecc.). Non deve mai essere disabilitata.
- [x] Isolamento Multi-tenant: Ogni tabella operativa ha il campo `organization_id`. Tutte le query sono limitate dalla RLS all'organizzazione di appartenenza dell'utente tramite join con `profiles` o tramite funzioni SQL dedicate.
- [x] Limitazioni per Ruolo: I ruoli `collaborator` e `doctor` vedono solo le pratiche/task/certificati specificamente assegnati a loro.
- [x] Protezione Aggiornamenti: Quando si scrivono policy `UPDATE` su RLS in Supabase, assicurarsi che la clausola `WITH CHECK` rifletta strettamente le condizioni della clausola `USING` per prevenire modifiche non autorizzate a campi sensibili.
- [x] Foreign keys relazionali per gli utenti devono referenziare `public.profiles(id)` e non `auth.users(id)` per supportare correttamente RLS e join di PostgREST in sicurezza.

## 3. Storage
- [x] Supabase Storage deve essere configurato come **privato**. Il bucket `documents` non è pubblico.
- [x] Accesso RLS su Storage: L'accesso in lettura/scrittura/cancellazione è limitato esclusivamente ai membri dell'organizzazione proprietaria (derivati dal path/folder della pratica).
- [x] L'accesso ai documenti da parte del frontend avviene unicamente tramite **URL firmati temporanei** generati lato server per gli utenti autenticati e autorizzati.

## 4. API Routes & Edge Functions
- [x] Ogni endpoint API o Server Action Next.js che accede o manipola dati controlla rigorosamente la sessione utente e l'organizzazione di appartenenza tramite `createClient()`.
- [x] Validazione Input: Le API limitano e validano gli input (es. `/api/chat` che implementa rate limiting e limite lunghezza messaggi) per prevenire abusi (DDoS o eccesso di token API).
- [x] Edge Functions: La funzione per processare embeddings (es. `gte-small`) limita la dimensione dei batch (max 4-8 elementi) per prevenire l'errore `WORKER_RESOURCE_LIMIT` dovuto a restrizioni di memoria dell'edge.
- [x] Prevenzione Open Redirects: I parametri utente come `redirect_to` sono passati attraverso l'utility `getSafeRedirect` (`src/utils/url.ts`) per assicurarsi che i reindirizzamenti avvengano solo verso il medesimo dominio (trusted base origin).

## 5. Pratiche Mediche e IA
- [x] Dati sensibili (referti, certificati medici) sono protetti. I medici hanno accesso solo a ciò che viene esplicitamente assegnato loro (`case_collaborators`).
- [x] L'IA (LLM/RAG) recupera solo i frammenti documentali consentiti dalla policy RLS `current_user_org_id()`.
- [x] L'IA non formula diagnosi mediche e riporta sempre l'assenza di dati laddove manchino frammenti validi recuperati. Nessuna allucinazione consentita per documenti inesistenti o per richieste extra-accesso.
