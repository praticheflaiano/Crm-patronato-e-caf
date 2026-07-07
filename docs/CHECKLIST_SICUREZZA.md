# Checklist Sicurezza Avanzata CRM

Questa checklist definisce gli standard di sicurezza per il CRM CAF/Patronato (Centro Pratiche Flaiano).
Ogni nuova funzionalità deve essere verificata rispetto a questi criteri prima del merge in produzione.

## 1. Supabase Auth
- [ ] Nessuna esposizione del `SUPABASE_SERVICE_ROLE_KEY` nel frontend o in variabili `NEXT_PUBLIC_*`.
- [ ] Chiave `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` utilizzata unicamente sul client.
- [ ] Tutti i token JWT utilizzati per le richieste API sono validati e protetti.
- [ ] Limitazioni di login e rate-limiting configurate per endpoint sensibili per prevenire brute-force.
- [ ] Sessioni gestite esclusivamente tramite `@supabase/ssr` / `@supabase/auth-helpers-nextjs` con i corretti flag di sicurezza per i cookie (`HttpOnly`, `Secure`).
- [ ] Le Server Actions in Next.js controllano sempre `auth.getUser()` prima di eseguire qualsiasi operazione sul database o servizi collegati.

## 2. Row Level Security (RLS)
- [ ] **RLS sempre attiva** su tutte le tabelle. Mai usare `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`.
- [ ] Isolamento dei Tenant (multi-organizzazione): Le policy per le tabelle dati (`contacts`, `cases`, `documents`, `tasks`, ecc.) richiedono SEMPRE che il record `organization_id` corrisponda a quello dell'utente autenticato (`user_organization_id()`).
- [ ] La policy RLS UPDATE utilizza la clausola `WITH CHECK` per restringere i dati inseribili/modificabili, speculare alla clausola `USING`, garantendo che l'utente non possa esfiltrare dati fuori dalla sua organizzazione o per altri ruoli.
- [ ] Accesso medico: La tabella `invalidity_details` o policy su `cases` limitano la lettura da parte del medico (`role = 'doctor'`) SOLO alle pratiche a lui assegnate (via `doctor_id` o `case_collaborators`).
- [ ] Accesso collaboratore: Simile ai medici, il `collaborator` può vedere solo ciò che gli è assegnato.
- [ ] Admin: L'amministratore (admin) dell'organizzazione ha accesso illimitato alle risorse **unicamente** della propria organizzazione.
- [ ] Nessun `GRANT EXECUTE` per le utility function `SECURITY DEFINER` (come `is_active_admin()`) al ruolo `public` o `anon`.

## 3. Storage e Documenti
- [ ] I bucket Storage sono rigorosamente privati (ad eccezione di eventuali asset pubblici specifici come i loghi, se necessario).
- [ ] Path scoping: I percorsi nel bucket `documents` (es. `{case_id}/filename`) usano le policy RLS dello Storage per validare che l'utente appartenga alla stessa organizzazione della pratica associata (derivata dal `case_id`).
- [ ] Download di file tramite Signed URLs limitati nel tempo. Nessun accesso URL diretto e permanente per documenti sensibili o sanitari.
- [ ] Filtraggio tipi di file. Rifiutare eseguibili (`.exe`, `.sh`, `.bat`, `.js`) o script mascherati per limitare RCE (Remote Code Execution) sui parser dei file.

## 4. API Routes e Next.js Server Components
- [ ] Le Route Handler (`/api/*`) richiedono autenticazione e controllano l'integrità dei parametri prima dell'elaborazione, in particolare su API che dialogano con servizi terzi (OpenRouter) o Supabase Edge Functions.
- [ ] Le query stringhe e i body JSON sono parsati rigorosamente tramite validatori come `Zod` (o TypeBox).
- [ ] Limitazione dei ratei per rotta (Rate Limiting). (es. API di Chat, API di upload).
- [ ] L'applicazione client non fa direttamente chiamate di mutazione su dati sensibili; passa sempre da Server Actions protette e validate.
- [ ] **Open Redirect Prevention**: I link di reindirizzamento (es. `?redirect_to=`) dopo login o azioni, usano l'utility `getSafeRedirect` per assicurarsi che i target rimangano nell'origine dell'applicazione.

## 5. Edge Functions
- [ ] Verificare che l'invocazione di Edge Functions richieda l'header `Authorization` con il Bearer Token dell'utente, validando così i permessi in esecuzione.
- [ ] Protezione della memoria: Limiti architetturali ai batch e ai dati processati (es. `gte-small` embeddings) per prevenire attacchi di tipo DoS o crash della Edge Function per errore `WORKER_RESOURCE_LIMIT`.
- [ ] Assenza di chiavi hardcoded o service role incontrollati nel codice Edge. Utilizzo dei Secret Supabase per API chiavi esterne.

## 6. Sicurezza AI / RAG
- [ ] L'AI Assistant opera unicamente sotto le policy RLS dell'utente. Il contesto restituito dalle query RAG (in pgvector) filtra per organizzazione.
- [ ] Nessuna esfiltrazione incrociata: Un utente (es. medico) non riceverà contesto o embeddings derivati da documenti a cui non ha accesso tramite RLS.
- [ ] Limitazione direttive (System Prompt): Esplicita protezione da prompt injection e istruzioni rigide per non restituire dati clinici o diagnosi se non da documentazione certificata.

## 7. Audit & Logging
- [ ] I cambiamenti critici (es. cambi stato utente, cancellazione massiva pratiche) devono essere loggati nella tabella `audit_logs` con un'impronta temporale e l'UUID dell'utente.
- [ ] Monitoraggio continuo (attraverso le metriche di Supabase o log di Vercel) per identificare chiamate anomale, spike nelle API (es. OpenRouter chat API), e potenziali tentativi di scraping sui documenti.
