# Checklist Sicurezza - CRM Patronato e CAF

Questo documento contiene la checklist di sicurezza del sistema CRM, coprendo Autenticazione, RLS (Row Level Security), Storage, API Routes e Edge Functions.

## 1. Autenticazione (Auth) e Gestione Sessioni
- [ ] Le chiavi pubbliche Supabase nel frontend devono avere il prefisso `NEXT_PUBLIC_`.
- [ ] La chiave `service_role` (Service Role Key) di Supabase deve essere utilizzata **solo** lato server (ad es. in Server Actions, API routes o Edge Functions) e non deve **mai** essere esposta al client.
- [ ] Utilizzare l'utility `getSafeRedirect` (in `src/utils/url.ts`) ogni volta che si gestiscono parametri di reindirizzamento forniti dall'utente (come `redirect_to`), per prevenire vulnerabilità di Open Redirect. L'utility garantisce che l'origine della URL target corrisponda alla base origin fidata.
- [ ] I nuovi account utente nascono con lo stato `pending` e permessi minimi. L'approvazione deve avvenire tramite un amministratore (tramite `approve_member()`).
- [ ] I campi sensibili di `profiles` (ruolo, organizzazione, stato) non devono poter essere modificati direttamente dall'utente tramite endpoint pubblici (es. revocato `UPDATE` tranne per `full_name`).

## 2. Row Level Security (RLS)
- [ ] La **Row Level Security (RLS) è obbligatoria** su tutte le tabelle operative del database Supabase e non deve mai essere disabilitata per aggirare errori.
- [ ] Nelle policy `UPDATE`, assicurarsi che la clausola `WITH CHECK` rispecchi fedelmente o restringa in modo appropriato le condizioni della clausola `USING`, per prevenire modifiche non autorizzate a campi protetti.
- [ ] Le tabelle operative (es. contatti, pratiche, documenti) devono includere il campo `organization_id` e le policy RLS devono isolare rigorosamente l'accesso in base a questa colonna.
- [ ] Controlli di accesso basati su ruolo (RBAC):
  - `admin` e `operator`: possono accedere a tutti i dati della propria organizzazione.
  - `collaborator`: possono accedere solo ai task/pratiche a loro assegnati.
  - `doctor`: possono accedere solo alle pratiche mediche a loro assegnate e ai relativi certificati.
- [ ] Le funzioni helper come `is_case_collaborator` devono essere `SECURITY DEFINER`, e i permessi di esecuzione (`EXECUTE`) devono essere concessi al ruolo `authenticated` (e non a `anon` o `public`).

## 3. Storage e Archiviazione Documenti
- [ ] Lo Storage di Supabase (es. il bucket `documents`) deve essere **privato**. I file non devono essere esposti pubblicamente.
- [ ] I file sensibili (inclusa la documentazione sanitaria) devono essere accessibili esclusivamente attraverso rigorose policy RLS legate all'organizzazione del file/pratica o tramite URL firmati temporanei.
- [ ] Nessuna funzionalità (ad es. RAG sui documenti sanitari) deve essere abilitata sui documenti sensibili senza aver prima passato controlli di RLS e aver accertato i permessi dell'utente corrente.

## 4. API Routes e Sicurezza Backend
- [ ] Validazione degli input: Tutti i parametri e i payload provenienti dal client devono essere validati lato server (es. limiti di lunghezza, tipi attesi).
- [ ] Rate limiting: Le chiamate API pubbliche o che consumano risorse esterne (es. `/api/chat` per OpenRouter) devono implementare meccanismi di rate limiting best-effort.
- [ ] Assicurarsi che le API estraggano l'utente autenticato dal client Supabase in un contesto server-side sicuro (es. `createClient()` lato server).
- [ ] L'assistente AI deve funzionare all'interno del perimetro dei permessi utente (le informazioni di contesto devono essere ottenute eseguendo query filtrate dall'RLS). L'AI non deve **mai** formulare diagnosi mediche, e quando l'informazione è mancante, deve dichiararlo esplicitamente per prevenire allucinazioni.

## 5. Edge Functions
- [ ] **Limiti di risorse:** Le Edge Functions che elaborano embedding o consumano parecchia memoria (es. utilizzando il modello `gte-small`) devono limitare la dimensione dei batch (es. massimo 4-8 elementi per invocazione) per evitare di generare errori HTTP 546 `WORKER_RESOURCE_LIMIT`.
- [ ] La connessione al database e le query eseguite dalle Edge Functions devono sempre utilizzare l'autenticazione JWT dell'utente o applicare RLS in caso di accesso autorizzato limitato.
- [ ] Il `search_path` per funzioni Postgres esposte o helper critici deve essere fissato (es. `set search_path = public, pg_temp;`) in modo da evitare bypass della sicurezza e override di funzioni interne.
- [ ] Le chiavi del database o chiavi esterne (es. OpenRouter API) devono essere caricate tramite variabili di ambiente o parametri DB protetti, e mai essere fornite o rese visibili al client.

## 6. Progettazione Schema (Best Practices)
- [ ] Quando si creano chiavi esterne (foreign keys) nelle migrazioni SQL di Supabase per relazioni sugli utenti, si deve referenziare `public.profiles(id)` al posto di `auth.users(id)`, in modo da facilitare e abilitare le join in PostgREST in modo trasparente.
- [ ] Le query applicative e le procedure SQL non devono eliminare documenti/informazioni importanti. Modificare o disabilitare (soft delete/status update) qualora necessario, tenendo traccia degli update via Audit Log.
