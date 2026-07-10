# Checklist Sicurezza CRM Patronato e CAF

Questo documento contiene le regole di sicurezza essenziali per il progetto.

## Autenticazione (Auth)
- Usare esclusivamente l'autenticazione di Supabase.
- Configurare una corretta gestione delle sessioni tramite SSR, non solo nel client (usare `createClient` da `@supabase/ssr`).
- Per l'onboarding, gli account iniziano come `pending` con permessi nulli e necessitano approvazione `admin` tramite funzioni `security definer`. Non consentire self-escalation o l'impostazione autonoma dell'`organization_id`.

## Row Level Security (RLS)
- **RLS è obbligatoria su tutte le tabelle** (`contacts`, `cases`, `documents`, `tasks`, ecc.) e non deve **mai** essere disabilitata, anche durante il debug in produzione.
- **Multitenancy**: Le query e policy CRUD devono sempre filtrare per `organization_id = (user_organization_id())`.
- Le funzioni helper come `current_user_org_id()` o `is_case_collaborator()` devono essere `SECURITY DEFINER` ed evitare recursion infinite (es. chiamare `profiles` all'interno di una policy su `profiles` richiede accortezza; preferire letture del jwt o chiamate ottimizzate senza self-joins bloccanti).
- Utilizzare i ruoli (`admin`, `operator`, `collaborator`, `doctor`) per definire policy capillari per operazioni diverse dalla `SELECT` o visibilità su interi subset di tabelle.

## Gestione Documenti (Storage)
- I bucket come `documents` devono essere contrassegnati come **Privati**.
- Le policy di accesso (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) sul bucket devono verificare l'appartenenza del documento alla pratica (usando il percorso prefix `{case_id}/`) e l'autorizzazione dell'utente verso quella specifica pratica (e la rispettiva organizzazione).
- Usare i Signed URLs temporanei (`createSignedUrl`) per la lettura lato client; non esporre file sanitari o moduli completati in chiaro.

## API Routes & Next.js
- **Mai esporre `SUPABASE_SERVICE_ROLE_KEY` lato client**.
- Usare rigorosamente l'autenticazione server-side dentro le routes API (es. `await createClient()`, poi `getUser()`).
- Controllare i rate limit: endpoint come `/api/chat` devono prevenire abusi tramite validazione server e/o rate limiters.
- L'assistente AI (RAG) deve estrapolare solo la conoscenza e i dettagli delle pratiche a cui **il singolo utente** ha accesso, propagando la validazione RLS anche in fase di similarità vettoriale (`pgvector`). Non consentire all'AI la diagnosi medica.

## Edge Functions & Modelli Vettoriali
- Considerare le limitazioni delle Edge Functions (come i `WORKER_RESOURCE_LIMIT`). Per l'embedding (es. con `gte-small`), impostare limiti rigidi sul batch size (es. max 4-8 elementi).
- Se si utilizzano secrets, instradarli tramite le secret variables della piattaforma (Vercel o Supabase Vault), senza farli leakare al client.

## Open Redirects
- Qualsiasi `redirect_to` gestito nei flussi di autenticazione o route handlers deve passare attraverso `getSafeRedirect` o logicamente bloccato alla root path se esterno, per prevenire Open Redirect attacks.

## Database & Sicurezza SQL
- Revocare i grant superflui ai ruoli `anon` e `public`.
- Le funzioni create a livello di database devono specificare esplicitamente un `search_path` (es. `SET search_path = public`).
- Limitare la direttiva `EXECUTE` sulle funzioni solo a ruoli appropriati (es. `authenticated`).
- Per l'importazione di CSV, validare fortemente la logica ed evitare di introdurre dati con SQL injection, usando sempre wrapper di Next/Supabase per le ORM e parametri named.
