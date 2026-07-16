# Checklist Sicurezza Sistema

Questa checklist contiene le verifiche e le configurazioni essenziali per garantire la sicurezza del CRM Patronato e CAF. Assicurarsi di rispettare e verificare tutti i punti regolarmente.

## 1. Autenticazione (Auth)
- [ ] **Configurazione Chiavi**: Non esporre mai `SUPABASE_SERVICE_ROLE_KEY` al frontend. Utilizzare solo `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [ ] **Onboarding Utenti**: Assicurarsi che i nuovi utenti (`profiles.status = 'pending'`) non possano accedere o visualizzare dati senza l'approvazione formale dell'Admin. I profili `pending` non devono avere `organization_id` assegnato.
- [ ] **Accesso API**: Validare i token JWT per ogni chiamata serverless o Edge Function. L'API di chat e embedding richiedono autenticazione rigida e RLS per prevenire abusi.

## 2. Row Level Security (RLS)
- [ ] **RLS Attiva**: La Row Level Security (RLS) deve essere abilitata su *tutte* le tabelle operative (e.g. `contacts`, `cases`, `documents`, `tasks`, `medical_certificates`).
- [ ] **Organizzazione**: Tutte le operazioni CRUD in tabelle multi-tenant devono vincolare la colonna `organization_id` a `current_user_org_id()`. Non consentire perdite (leak) di dati cross-org.
- [ ] **Regole UPDATE**: Nelle policy RLS di UPDATE, assicurarsi che le condizioni della clausola `WITH CHECK` riflettano rigorosamente quelle di `USING` per evitare aggiornamenti a campi sensibili non autorizzati.
- [ ] **Helper RLS**: Le funzioni `SECURITY DEFINER` utilizzate dalle policy RLS (come `is_case_collaborator`) devono avere `EXECUTE` concesso al ruolo `authenticated` e precluso (`REVOKE`) ad `anon` e `public`.

## 3. Storage
- [ ] **Bucket Privati**: Il bucket `documents` deve essere *privato*. L'accesso e download avvengono esclusivamente tramite URL temporanei e firmati (`signed URLs`).
- [ ] **Policy Storage**: Limitare la visibilità e le operazioni in `documents` ai soli membri dell'organizzazione proprietaria della pratica, dedotta dal prefisso del percorso (es. `{case_id}/`).

## 4. API Routes & Edge Functions
- [ ] **Rate Limiting**: Implementare limitazioni di richieste (Rate Limit) per contenere potenziali abusi sull'API di chat OpenAI/OpenRouter (`/api/chat`).
- [ ] **Validazione Input**: Tutti gli input forniti dagli utenti passati ad API Routes devono essere rigorosamente validati (e.g. con Zod).
- [ ] **Protezione Edge Limits**: Le funzioni serverless pesanti (come l'embedding pgvector `gte-small`) devono lavorare con lotti limitati (batch massimi raccomandati: 4-8 elementi) per prevenire l'esaurimento della memoria e l'errore `HTTP 546 WORKER_RESOURCE_LIMIT`.
- [ ] **Prevenzione Open Redirect**: Usa `getSafeRedirect` (in `src/utils/url.ts`) ogni volta che si accetta un URL di destinazione post-login/operazione (`redirect_to`). Assicurati che l'origine della richiesta corrisponda.

## 5. Privacy dei Dati ed AI
- [ ] **Senza Diagnosi**: Il sistema AI integrato non deve fornire diagnosi mediche, limitandosi a funzioni di ricerca e sintesi procedurale (RAG).
- [ ] **Dati RAG Protetti**: I chunk di documento recuperati per le query AI (`pgvector`) devono essere isolati tramite RLS hard-scoped `current_user_org_id()`. L'AI deve interrogare unicamente i dati accessibili all'utente in sessione.
- [ ] **Memoria Browser e Server**: I dati cronologici di base sensibili possono rimanere nel frontend (localStorage/DB utente) o, se gestiti a livello di DB (cronologia sessioni), devono avere una policy stretta e permettere all'utente di azzerarla.
