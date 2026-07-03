# CHECKLIST_SICUREZZA.md

## Sicurezza del Sistema - Linee Guida e Verifiche

Questo documento elenca i controlli di sicurezza implementati nel CRM, coprendo Autenticazione (Auth), Row Level Security (RLS), Archiviazione (Storage), API Routes e Edge Functions. Ogni modifica all'architettura deve passare attraverso questa checklist.

### 1. Autenticazione (Supabase Auth)
- [x] L'autenticazione è gestita tramite Supabase Auth (Sessioni JWT su cookie HTTP-only per SSR o autorizzazioni sicure).
- [x] Non viene utilizzato il `service_role_key` lato client. Nessuna variabile `NEXT_PUBLIC_` contiene chiavi amministrative.
- [x] Trigger di onboarding sicuro: `on_auth_user_created` chiama `handle_new_user()` per forzare un nuovo account nello stato `pending` e revocare l'organizzazione iniziale.
- [x] Gestione profili bloccata: gli aggiornamenti di `organization_id`, `role` e `status` sono bloccati lato RLS e `REVOKE`. Vengono modificati unicamente tramite funzioni PL/pgSQL in `security definer` protette da `is_active_admin()`.

### 2. Row Level Security (RLS)
- [x] RLS è OBBLIGATORIAMENTE abilitata su TUTTE le tabelle operative (es. `contacts`, `cases`, `documents`, `tasks`, `medical_certificates`). Non disattivare RLS per risolvere bug applicativi.
- [x] Isolamento per organizzazione: le policy RLS verificano sempre `organization_id = public.current_user_org_id()`.
- [x] Il comando `WITH CHECK` nelle policy UPDATE rispecchia e restringe accuratamente `USING`, in modo che l'organizzazione non possa essere alterata surrettiziamente durante gli aggiornamenti.
- [x] Funzioni DB indurite: i `search_path` di funzioni come `set_current_user_organization_id()` e `current_user_org_id()` sono configurati in modo statico su `public` per evitare iniezioni e attacchi sui ruoli di esecuzione. I privilegi di esecuzione inutili (es. `EXECUTE` su public/anon) sono stati revocati.
- [x] Accesso dei collaboratori: il ruolo `collaborator` è limitato a leggere le pratiche a lui esplicitamente assegnate, controllate tramite `is_case_collaborator()`.
- [x] Accesso dei medici: i medici possono accedere solo alle pratiche mediche e ai certificati in cui sono aggiunti come collaboratori di tipo `doctor`.

### 3. Archiviazione (Supabase Storage)
- [x] Il bucket `documents` è configurato come **privato**.
- [x] Le regole RLS sul bucket Storage sono in essere e limitano operazioni e lettura ai soli membri dell'organizzazione (risolte tramite il path `{case_id}/...` dei file).
- [x] L'URL dei file non è staticamente pubblico, l'accesso avviene unicamente generando `signed_urls` temporanei generati dal server.
- [x] I limiti di dimensione in upload dei file sono attivati per prevenire Denial of Service.
- [x] Solo l'interfaccia approvata esegue i caricamenti (prevenzione cross-origin uploads).

### 4. API Routes e Next.js App Router
- [x] Le route di API server (`/api/chat`, `/api/knowledge`, etc.) controllano sempre il JWT tramite `supabase.auth.getUser()`.
- [x] Tutte le input (inclusi JSON payload e file multipart) sono sanitize, verificate o validate in ingresso (es. controlli di nullità e cast coerente in `route.ts`).
- [x] Controllo Rate-Limiting: endpoint come `/api/chat` implementano Rate Limit best-effort in memoria (es. massimo di messaggi per un window period) per mitigare abusi dei costi dell'IA (OpenRouter).
- [x] Limitazioni in input e output della chat AI per evitare messaggi smisurati (buffer overrun e max token limit per OpenRouter).
- [x] Open Redirect Protection: l'uso del redirect via URL query parameters è messo in sicurezza da utility come `getSafeRedirect()` che validano gli origin dei redirect.
- [x] Le variabili d'ambiente (come la chiave di OpenRouter) risiedono solo in ambiente sicuro e sono caricate in istanze di Supabase client protette o Admin bypassanti.

### 5. Edge Functions
- [x] L'Edge Function `embed` verifica i Token JWT del chiamante per limitare gli invii di embedding.
- [x] Controllo sulle risorse in Edge Functions: L'Edge Function processa embeddings con lotti limitati e dimensionati per prevenire il superamento del tetto del worker RAM (es. limiti batch a 4-8 elementi).
- [x] Hardening sulle richieste JSON: Edge Functions gestiscono malformazioni dei body via catch/fallback ed evitano runtime panic.

---
**Nota finale**: Tutte le modifiche applicate al codice per importazione bulk, upload documenti o flussi di lavoro, sono tenute ad osservare scrupolosamente questa checklist.
