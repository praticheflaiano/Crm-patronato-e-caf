# Checklist Sicurezza Sistema

Questo documento raccoglie le best practice e i controlli di sicurezza fondamentali per il sistema CRM Patronato e CAF. Assicurarsi di rispettare e verificare periodicamente questi punti.

## 1. Autenticazione (Auth)

- [ ] **Utilizzo Chiavi Supabase**: Utilizzare esclusivamente la chiave `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o legacy anon key) sul client.
- [ ] **Protezione Chiave Service Role**: La chiave `SUPABASE_SERVICE_ROLE_KEY` deve essere usata **solo ed esclusivamente** server-side per bypass di sistema controllati (es. trigger o webhook), mai esposta al client.
- [ ] **Disabilitazione Permessi Pubblici**: Gli utenti non autenticati (ruolo `anon`) o la keyword `public` non devono avere accesso in `EXECUTE` alle funzioni interne o in lettura/scrittura sui dati.

## 2. Row Level Security (RLS)

- [ ] **RLS Obbligatoria**: Row Level Security deve essere abilitata su **tutte** le tabelle del database (es. `contacts`, `cases`, `documents`, `tasks`, ecc.). Non disattivare mai la RLS per comodità.
- [ ] **Isolamento Organizzazione**: Tutte le query e le operazioni sui dati devono essere isolate e filtrare in base alla colonna `organization_id` per garantire il multitenancy.
- [ ] **Parità delle Condizioni (USING / WITH CHECK)**: Nelle policy di `UPDATE`, la clausola `WITH CHECK` deve corrispondere in maniera identica o più restrittiva alla clausola `USING`, onde evitare la modifica non autorizzata dei record letti limitando la scalata dei privilegi.
- [ ] **Utilizzo Security Definer per Isolamento RLS**: In caso di riferimenti incrociati complessi che causano loop o recursion nell'esecuzione della RLS, usare funzioni `SECURITY DEFINER` (es. `is_case_collaborator()`, `current_user_org_id()`) con restrizione appropriata (`revoke execute`).

## 3. Archiviazione Documenti (Storage)

- [ ] **Bucket Privati**: I bucket dello storage (es. `documents`) devono essere categoricamente configurati come **privati**.
- [ ] **Limitazione Accesso RLS**: Anche per lo storage, le policy di Row Level Security devono restringere l'accesso in base alla propria organizzazione (verificando ad esempio i permessi della pratica a cui il documento è allegato).
- [ ] **URL Firmati Temporanei**: Per il download e la lettura dei documenti, generare sempre e solo URL firmati (signed URLs) con breve scadenza.
- [ ] **Nessun Accesso Anonimo**: Disabilitare l'accesso ai bucket storage da parte di utenti `anon`.

## 4. API Routes e Sicurezza Next.js

- [ ] **Protezione Input e Redirect (Open Redirect)**: Validare accuratamente gli input utente. Per i redirect (es. query string `?redirect_to=`), usare sempre utilità specifiche come `getSafeRedirect()` per accertarsi che le URL di destinazione appartengano al dominio originario e non inducano phishing.
- [ ] **Validazione e Tipizzazione (Zod/TypeScript)**: Gli input alle API e alle form devono essere validati tramite server-side action sicure, combinando Zod e tipizzazione forte.
- [ ] **Protezione Endpoint**: Autenticare e verificare il livello di accesso dell'utente in ogni singola Server Action o API Route, ad es. chiamando le librerie di Supabase Auth server-side per confermare la sessione prima dell'azione.

## 5. Edge Functions

- [ ] **Protezione Token d'Accesso (JWT)**: Assicurarsi che le Edge Function valide richiedano un token JWT valido per essere invocate (se esposte a logica privata dell'applicazione).
- [ ] **Limitazione delle Risorse (Limit Batch)**: Come riscontrato in produzione (errore `HTTP 546 WORKER_RESOURCE_LIMIT` su embedding), i batch di chiamate verso i motori integrati (es. `gte-small`) devono essere ridotti per adattarsi ai limiti di memoria del runtime edge (es. limite difensivo di 4-8 elementi per chiamata).

## 6. Sicurezza AI / RAG

- [ ] **Limitazioni Mediche**: L'AI deve essere programmata (tramite System Prompt) per rifiutarsi rigorosamente di fornire responsi, referti o diagnosi mediche.
- [ ] **Rispetto Privilegi AI**: Gli engine AI / RAG o di indicizzazione devono ricevere o visualizzare **solo** documenti ed elenchi pratiche su cui l'utente che effettua la chiamata detiene effettivo accesso (il contesto viene calcolato rispettando le policy utente in DB).
- [ ] **Prevenzione delle Allucinazioni**: L'AI deve essere istruita per ammettere la mancanza di conoscenza invece che generare dati inesistenti o confusi.
