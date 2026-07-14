# Checklist Sicurezza CRM Patronato e CAF

Questa checklist raccoglie le best practice e i controlli di sicurezza implementati nel progetto, per garantire un elevato standard di protezione dei dati, con particolare attenzione alle informazioni sanitarie e sensibili gestite dal sistema.

## 1. Autenticazione (Auth)
- [ ] **MFA (Multi-Factor Authentication)**: Valutare l'implementazione dell'autenticazione a due fattori per gli account `admin` e `doctor`.
- [x] **Service Role Key**: La chiave `service_role` di Supabase è utilizzata **esclusivamente** lato server. Non è mai esposta al client.
- [x] **Variabili d'ambiente**: Le chiavi pubbliche Supabase nel frontend sono esplicitamente prefissate con `NEXT_PUBLIC_`. Le variabili private non hanno questo prefisso.
- [x] **Onboarding Protetto**: I nuovi utenti nascono con stato `pending`, senza organizzazione e con ruolo minimo. L'approvazione è gestita tramite la funzione `security definer` `approve_member()`, protetta da `is_active_admin()`.
- [x] **Open Redirect Prevention**: Utilizzo dell'utility `getSafeRedirect` in `src/utils/url.ts` quando si gestiscono parametri di reindirizzamento forniti dall'utente (`redirect_to`).

## 2. Row Level Security (RLS)
- [x] **RLS Attiva Ovunque**: Row Level Security è abilitata su tutte le tabelle. Non deve essere mai disattivata.
- [x] **Isolamento Organizzazione**: I dati (contatti, pratiche, task, documenti) sono segregati per organizzazione (`organization_id`). Le policy RLS limitano l'accesso in base alla `organization_id` dell'utente.
- [x] **Accesso Basato sui Ruoli (RBAC)**:
  - `admin` e `operator`: accesso a tutti i dati dell'organizzazione.
  - `collaborator`: accesso solo alle pratiche e task a loro assegnati.
  - `doctor`: accesso limitato ai documenti sanitari e alle pratiche cliniche assegnate (`case_collaborators` con `role='doctor'`).
- [x] **Policy UPDATE Restrittive**: Le policy di `UPDATE` in Supabase presentano la clausola `WITH CHECK` che rispecchia o restringe le condizioni della clausola `USING` per prevenire modifiche non autorizzate o escalation di privilegi (es. auto-promozione di ruolo in `profiles`).
- [x] **Hardening Funzioni RLS**: Funzioni helper RLS (come `is_case_collaborator`) utilizzano `SECURITY DEFINER` e verificano `auth.uid()`, con `search_path` fissato per evitare attacchi di iniezione.

## 3. Storage
- [x] **Bucket Privati**: I documenti, in particolare le pratiche e le cartelle cliniche, sono archiviati nel bucket privato `documents`.
- [x] **Accesso Scoped per Organizzazione**: Le policy su Supabase Storage limitano l'accesso al path del file (es. `{case_id}/`) ai soli membri dell'organizzazione proprietaria e/o ai collaboratori autorizzati (medici/collaboratori).
- [x] **URL Firmati**: I download di file riservati avvengono tramite Signed URLs temporanei, non tramite URL pubblici.

## 4. API Routes
- [x] **Validazione Input**: I payload in ingresso alle route `/api/*` (es. `/api/chat`, upload) sono sanificati e tipizzati rigorosamente.
- [x] **Rate Limiting**: Endpoint esposti (in particolare `/api/chat`) includono un meccanismo di rate limiting best-effort per prevenire abusi sui costi API (OpenRouter) o DoS.
- [x] **Autorizzazione Context-Aware**: I contesti AI (RAG) sfruttano l'utente autenticato per garantire che i frammenti inviati nel prompt contengano solo dati accessibili a quell'utente specifico.

## 5. Edge Functions
- [x] **Limite Risorse (Worker Resource Limit)**: Le Edge Functions per l'elaborazione (es. l'embedding via `gte-small`) utilizzano batch size ridotti (max 4-8 elementi) per prevenire l'errore `HTTP 546 WORKER_RESOURCE_LIMIT`.
- [x] **Autenticazione Richiesta**: L'invocazione delle funzioni edge richiede un token JWT valido per prevenire utilizzi anonimi non autorizzati (se applicabile).

## 6. Assistente AI e RAG
- [x] **Protezione Dati Clinici**: L'assistente AI ha restrizioni rigide: non fornisce diagnosi mediche e non ha accesso diretto a documenti sanitari se non rigorosamente filtrato.
- [x] **Scope della Conoscenza**: La ricerca vettoriale `match_knowledge_chunks` è limitata ai documenti dell'organizzazione dell'utente loggato. In caso di dubbio l'assistente deve esplicitare la mancanza di informazioni.
