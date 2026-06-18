# Checklist Sicurezza CRM Patronato e CAF

Questa checklist garantisce che le configurazioni di sicurezza essenziali siano verificate e mantenute durante lo sviluppo e prima di ogni deploy in produzione.

## 1. Autenticazione (Auth)

- [ ] **Nessun ruolo di default permissivo**: Nuovi utenti nascono con stato `pending` e senza permessi operativi finché un admin non li approva.
- [ ] **Variabili d'ambiente sicure**: `SUPABASE_SERVICE_ROLE_KEY` è usata solo lato server e mai esposta al client. Le variabili pubbliche hanno il prefisso `NEXT_PUBLIC_`.
- [ ] **Rate Limiting Auth**: Supabase Auth è configurato con limiti per i tentativi di login.

## 2. Row Level Security (RLS)

- [ ] **RLS sempre attiva**: Mai disabilitare RLS per bypassare errori.
- [ ] **Tutte le tabelle operative hanno RLS**: (`contacts`, `cases`, `documents`, `tasks`, `medical_certificates`, ecc.).
- [ ] **Isolamento organizzativo**: Le policy di default limitano l'accesso tramite la clausola `organization_id = (select organization_id from profiles where id = auth.uid())` o equivalenti sicuri.
- [ ] **Hardening delle Policy**: Le policy che aggiornano dati sensibili (es. profili) controllano strettamente il campo autorizzato. Non si fa affidamento su ruoli utente che possono essere manomessi (es. usare query SQL blindate).
- [ ] **WITH CHECK in UPDATE**: Assicurarsi che le clausole `WITH CHECK` nelle policy di `UPDATE` siano restrittive quanto le clausole `USING` per impedire la modifica arbitraria dei campi.
- [ ] **Filtro Medico/Collaboratori**: Accessi `doctor` e `collaborator` sono isolati solo ai record in cui risultano assegnati o collaboratori (tramite le policy RLS corrispondenti).
- [ ] **Security Definer Function Hardening**: Tutte le funzioni `SECURITY DEFINER` o usate in helper RLS hanno il `search_path` impostato, e `EXECUTE` revocato al ruolo `public` se contengono logica privilegiata.

## 3. Storage

- [ ] **Bucket Privati**: Il bucket `documents` non è pubblico.
- [ ] **Accesso condizionato (RLS su Storage)**: Le operazioni in `storage.objects` sono limitate in base all'appartenenza all'organizzazione del creatore della pratica (`case_id`).
- [ ] **URL Firmati**: I download di file avvengono tramite Signed URL a scadenza invece di URL pubblici permanenti.

## 4. API Routes e Server Actions

- [ ] **Verifica utente**: Ogni API route e Server Action convalida la sessione (`supabase.auth.getUser()`) prima di eseguire la logica.
- [ ] **Rate Limiting e Input Validation**: Limiti implementati su endpoint costosi o pubblici (es. `/api/chat`).
- [ ] **Validazione server-side dei payload**: I dati immessi dall'utente sono sempre convalidati e puliti sul server prima di inserirli nel database.

## 5. Edge Functions e AI/RAG

- [ ] **Memory Limit Edge Functions**: Batch size limitata per evitare crash `HTTP 546 WORKER_RESOURCE_LIMIT` su operazioni di embedding (es. max 4-8 elementi).
- [ ] **RAG Isolation**: L'embedding RAG restituisce solo frammenti associati alla `organization_id` dell'utente. Nessun dato travalica i permessi utente.
- [ ] **Prompt AI blindato**: Nessun assistente AI è autorizzato a comporre diagnosi mediche.

## 6. Operazioni Database & Migrazioni

- [ ] **Non usare array mutabili incautamente**: In JS/TS non usare `.sort()` direttamente su array mutabili. Usare la sintassi spread (`[...array].sort()`) o `.toSorted()`.
- [ ] **Chiavi esterne (Foreign Keys)**: Usare `public.profiles(id)` al posto di `auth.users(id)` per permettere i Join tramite l'API di Supabase/PostgREST.
- [ ] **Idempotenza Migrazioni**: Qualsiasi migrazione RLS o di schema deve poter girare in modo idempotente per evitare duplicazioni o fallimenti accidentali.
