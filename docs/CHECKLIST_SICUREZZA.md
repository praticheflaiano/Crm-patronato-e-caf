# Checklist di Sicurezza (Security Checklist)

Questo documento definisce le linee guida e i controlli di sicurezza obbligatori per il progetto CRM CAF/Patronato (Centro Pratiche Flaiano).

## 1. Autenticazione e Gestione Utenti (Auth)
- [ ] **Stato Iniziale Utente**: I nuovi utenti devono essere creati nello stato `pending`, senza organizzazione assegnata e con il ruolo minimo (trigger `handle_new_user()`).
- [ ] **Assegnazione Ruoli e Organizzazione**: L'assegnazione di ruolo, organizzazione e stato deve avvenire esclusivamente tramite la funzione *security definer* `approve_member()`, protetta dalla funzione `is_active_admin()`.
- [ ] **Gestione Chiavi**: La chiave `service_role` di Supabase deve essere utilizzata ESCLUSIVAMENTE lato server e MAI esposta al client.
- [ ] **Chiavi Pubbliche**: Le chiavi Supabase pubbliche devono avere esplicitamente il prefisso `NEXT_PUBLIC_`.

## 2. Row Level Security (RLS)
- [ ] **Obbligo RLS**: La RLS (Row Level Security) è obbligatoria su tutte le tabelle Supabase e non deve MAI essere disattivata.
- [ ] **Isolamento Organizzativo (Multi-tenant)**: Le tabelle operative devono includere un campo `organization_id`. Le policy RLS devono limitare l'accesso in base al `organization_id` dell'utente.
- [ ] **Aggiornamenti (UPDATE Policies)**: Quando si scrivono policy RLS `UPDATE`, assicurarsi che la clausola `WITH CHECK` rispecchi rigorosamente o restringa adeguatamente le condizioni della clausola `USING` per prevenire modifiche non autorizzate a campi protetti.
- [ ] **Controllo Accessi Basato sui Ruoli (RBAC)**:
  - **Admin e Operatori**: Possono accedere a tutti i dati della propria organizzazione.
  - **Collaboratori**: Possono accedere solo a pratiche, task e documenti esplicitamente assegnati a loro.
  - **Medici (Doctor)**: Possono accedere esclusivamente ai casi medici (Invalidità Civile) e relativi certificati a loro assegnati. Non devono avere accesso all'anagrafica generale.

## 3. Storage
- [ ] **Privacy Bucket Documenti**: Lo storage Supabase per i documenti DEVE essere impostato come privato (non pubblico).
- [ ] **Accesso File Sensibili**: L'accesso ai documenti e file sensibili deve avvenire solo tramite policy RLS rigorose o l'utilizzo di *signed URLs* temporanei generati lato server.
- [ ] **Scoping Storage per Organizzazione**: L'accesso al bucket `documents` (lettura/scrittura/eliminazione) deve essere limitato ai soli membri dell'organizzazione proprietaria della pratica (spesso derivata dal prefisso `{case_id}/` del path).

## 4. API Routes ed Edge Functions
- [ ] **Rate Limiting e Validazione**: Tutte le API, in particolare quelle che consumano risorse o costi esterni (es. `/api/chat`), devono avere un robusto sistema di rate limiting e validare rigorosamente gli input in ingresso (lunghezza, tipo, contenuto).
- [ ] **Edge Functions (Embeddings)**: Le Supabase Edge Functions che processano embeddings (es. utilizzando il modello `gte-small`) devono limitare la dimensione dei batch (es. massimo 4-8 elementi per esecuzione) per evitare l'errore `HTTP 546 WORKER_RESOURCE_LIMIT` dovuto ai limiti di memoria degli edge worker.
- [ ] **Open Redirect Prevention**: Utilizzare sempre l'utility `getSafeRedirect` in `src/utils/url.ts` per gestire i parametri di reindirizzamento forniti dall'utente (come `redirect_to`). Questo assicura che l'origine della URL di destinazione coincida con la base origin fidata.

## 5. Schema Database e Best Practices
- [ ] **Foreign Keys e Joins**: Quando si creano chiavi esterne (foreign keys) nelle migrazioni SQL relative agli utenti, referenziare sempre `public.profiles(id)` al posto di `auth.users(id)`. Questo permette al motore PostgREST di eseguire join dirette con i dati del profilo senza problemi.
- [ ] **Hardening Funzioni**: Bloccare il `search_path` per funzioni definite nel database e revocare privilegi di esecuzione inutili ai ruoli `public`, `anon` e `authenticated` (es. limitare accesso diretto a RLS helpers come `is_case_collaborator`).

## 6. Sviluppo e Integrazione
- [ ] L'assistente AI DEVE rispettare strettamente i permessi di accesso dell'utente, dichiarare in modo esplicito se mancano informazioni (evitare allucinazioni) e NON fornire mai diagnosi mediche.
- [ ] Ogni fase di sviluppo deve superare build, lint, check dei tipi TypeScript e tutti i test automatizzati (`npm run test`) prima di procedere alla successiva.
