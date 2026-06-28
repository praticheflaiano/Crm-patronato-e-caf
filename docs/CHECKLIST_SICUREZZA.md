# Checklist Sicurezza CRM Patronato e CAF

Questa checklist garantisce che le configurazioni critiche del sistema rispettino i requisiti di sicurezza e le best practices, assicurando l'isolamento dei dati (multi-tenant) e la protezione delle informazioni personali (PII) e sanitarie.

## 1. Supabase Auth & Profili
- [ ] Il login utilizza esclusivamente canali sicuri e i token JWT sono gestiti tramite Next.js middleware per impedire session leak.
- [ ] Il trigger `on_auth_user_created` crea il profilo utente in stato `pending`, senza `organization_id` e con ruolo minimo.
- [ ] Le modifiche ai ruoli o alle organizzazioni degli utenti (`profiles`) sono possibili solo tramite funzioni DB in `security definer` richiamate da amministratori verificati.
- [ ] La disattivazione di un utente invalida le sue sessioni (o lo blocca tramite RLS alle risorse).
- [ ] I clienti/utenti possono aggiornare tramite API solo il proprio `full_name` o le proprie preferenze, non ruoli, status o permessi (revocato `UPDATE` diretto sui campi critici).

## 2. Row Level Security (RLS)
- [ ] RLS è abilitata in maniera esplicita su **tutte** le tabelle operative (`contacts`, `cases`, `documents`, `tasks`, `medical_certificates`, `knowledge_documents`, ecc.).
- [ ] Tutte le policy RLS operative sono vincolate (scoped) all'`organization_id` tramite funzioni come `current_user_org_id()`. Non vi è mai accesso root per ruoli autenticati non-admin.
- [ ] Per l'accesso differenziato (es. medici certificatori), le RLS consentono solo le pratiche specifiche (`is_case_collaborator` o check sulla tabella `case_collaborators`).
- [ ] Le funzioni DB helper per la RLS hanno un `search_path` definito in modo stringente per prevenire search_path injection.
- [ ] Quando si scrivono policy `UPDATE` (es. in SQL o tramite console), la clausola `WITH CHECK` riflette e restringe correttamente la clausola `USING` per prevenire update su campi bloccati o scalata privilegi.

## 3. Storage
- [ ] Il bucket `documents` è configurato come **privato**.
- [ ] L'accesso ai documenti da parte dei client non autenticati o da utenti non in organizzazione è bloccato (policy su `storage.objects`).
- [ ] File sensibili, sanitari e certificati vengono serviti unicamente tramite **Signed URLs** generati con scadenze ristrette.
- [ ] Il percorso dei file per le pratiche segue rigorosamente la struttura `{case_id}/nome_file` e le policy RLS verificano l'appartenenza di `case_id` all'organizzazione.

## 4. API Routes e Server Actions
- [ ] Nessuna **Service Role Key** è esposta alle API route client o server components (solo lato server per operazioni di override). Le chiavi pubbliche (`NEXT_PUBLIC_*`) sono le uniche sul client.
- [ ] Le Route API (es. `/api/chat`, `/api/export`) effettuano esplicite verifiche dell'autenticazione tramite `supabase.auth.getUser()`.
- [ ] È implementato il Rate Limiting sulle API a consumo (come la chat AI) per prevenire attacchi DoS o abuso di token.
- [ ] Tutti i redirect dinamici, in particolare tramite il parametro query `redirect_to`, passano per la utility `getSafeRedirect` per difendersi da attacchi Open Redirect.

## 5. Edge Functions
- [ ] Le comunicazioni con Edge Functions in Supabase richiedono l'Authorization Token JWT dell'utente autenticato (`Authorization: Bearer <token>`).
- [ ] I task che consumano risorse (es. la funzione `embed` per vettorizzazione pgvector) limitano i batch size (es. max 4-8 elementi) per prevenire l'errore HTTP 546 `WORKER_RESOURCE_LIMIT`.
- [ ] Input da utente e documenti sono sanitizzati in Edge Function prima di interfacciarsi con LLM o query.

## 6. Intelligenza Artificiale e Dati
- [ ] Le RAG queries utilizzano funzioni che pre-filtrano rigorosamente tramite `current_user_org_id()` (no access leak tra tenant).
- [ ] Il prompt per l'assistente AI vieta categoricamente di formulare raccomandazioni o diagnosi mediche in ogni circostanza.
- [ ] Non vengono generati embeddings su campi di PII sensibili ove non strettamente necessario, e qualora fatto, il sistema di memorizzazione segue stringenti policy RLS.