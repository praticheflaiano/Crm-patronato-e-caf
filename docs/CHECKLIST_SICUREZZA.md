# Checklist Sicurezza Avanzata - CRM CAF/Patronato

Questo documento contiene la checklist di sicurezza del sistema, a copertura di Auth, RLS, Storage, API Routes ed Edge Functions.

## 1. Autenticazione e Gestione Profili (Auth)
- [ ] L'iscrizione di nuovi utenti è soggetta ad approvazione da parte di un admin (`profiles.status = 'pending'`).
- [ ] Nessun utente può modificare il proprio ruolo o la propria organizzazione autonomamente (Escalation prevention).
- [ ] L'unico campo del profilo aggiornabile direttamente dall'utente è `full_name`.
- [ ] Le funzioni sensibili (es. `approve_member`) utilizzano `SECURITY DEFINER` ma validano i permessi di chi le chiama.
- [ ] Nessuna esposizione del `service_role_key` lato client.

## 2. Row Level Security (RLS)
- [ ] RLS è abilitata su TUTTE le tabelle applicative.
- [ ] Nessuna policy RLS disabilitata per aggirare errori di permessi.
- [ ] Policy "Admin": accesso totale (CRUD) garantito sui record della propria organizzazione.
- [ ] Policy "Operatore": accesso limitato in base alle pratiche assegnate o all'organizzazione, come definito dalla business logic.
- [ ] Policy "Collaboratore": accesso circoscritto solo ai record (es. contatti/pratiche) esplicitamente assegnati.
- [ ] Policy "Medico": accesso strettamente limitato alle pratiche sanitarie assegnate, con visibilità unicamente sui dati pertinenti. Nessun accesso a pratiche amministrative generiche.
- [ ] Filtri RLS implementano rigorosamente il controllo `organization_id = current_user_org_id()` ove applicabile.
- [ ] Le clausole `WITH CHECK` nelle policy di `UPDATE` rispecchiano le clausole `USING` (o sono più restrittive) per impedire modifiche non autorizzate (es. furto di record da altre org).

## 3. Storage e Documenti
- [ ] I bucket di storage (es. `documents`) sono configurati come privati.
- [ ] L'accesso ai documenti avviene solo tramite permessi RLS e/o Signed URLs di durata limitata.
- [ ] Documenti medici/sanitari visibili esclusivamente agli utenti con ruolo appropriato e assegnazione verificata.
- [ ] Implementazione di policy RLS lato Storage (se supportate) o lato database che convalidino le richieste per il bucket.

## 4. API Routes e Sicurezza Backend (Next.js)
- [ ] Tutte le route in `/api` verificano l'autenticazione tramite `supabase.auth.getUser()`.
- [ ] Controllo lato server dell'appartenenza all'organizzazione prima di elaborare la richiesta.
- [ ] Controllo lato server dei permessi (Ruolo) prima di azioni sensibili (es. import, export, delete).
- [ ] Gestione dei redirect utente tramite utility `getSafeRedirect` (prevenzione Open Redirect).
- [ ] Validazione degli input in ingresso (es. parsing di stringhe, validazione formati CSV/JSON).

## 5. Edge Functions e Intelligenza Artificiale
- [ ] Le Edge Functions in Supabase richiedono l'autenticazione tramite JWT (Authorization Header).
- [ ] Limiti sui batch in elaborazione (es. max 4-8 elementi per embedding) per rispettare i limiti di memoria del worker (es. evitare errori `WORKER_RESOURCE_LIMIT`).
- [ ] Nessun salvataggio di cronologia chat con dati sensibili al di fuori delle tabelle coperte da RLS.
- [ ] RAG (Retrieval-Augmented Generation) esegue ricerche (`pgvector`) sempre in aderenza ai limiti RLS dell'utente. L'AI non ha un accesso globale e non autorizzato ai dati.
- [ ] Direttive di sistema chiare (System Prompts) che impediscono all'assistente AI di formulare diagnosi mediche o di accedere a dati non pertinenti.
