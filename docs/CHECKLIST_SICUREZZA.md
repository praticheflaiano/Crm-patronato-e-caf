# Checklist di Sicurezza e Hardening

Questo documento traccia l'implementazione e la verifica delle pratiche di sicurezza previste dal CRM.

## 1. Gestione Accessi e Identità
- [x] L'autenticazione è gestita tramite Supabase Auth.
- [x] I profili utente (`profiles`) sono legati a `auth.users(id)`.
- [x] I nuovi utenti nascono nello stato `pending` con permessi minimi.
- [x] Il ruolo (`role`) e lo stato (`status`) possono essere modificati solo dagli `admin`.
- [x] Funzioni di gestione profili (`approve_member`) eseguite con `SECURITY DEFINER` ma protette da RLS e controlli interni sul ruolo.
- [x] Gli utenti "disabled" o "pending" non hanno accesso alle risorse operative grazie allo scope su `organization_id`.

## 2. Row Level Security (RLS)
- [x] RLS è abilitata (ENABLE ROW LEVEL SECURITY) su tutte le tabelle.
- [x] Nessuna tabella è bypassabile disabilitando l'RLS.
- [x] L'accesso è delimitato da `organization_id` per admin e operatori (`is_org_member`).
- [x] L'accesso è delimitato a pratiche/task specifiche per collaboratori esterni (`assigned_to`).
- [x] L'accesso è delimitato per `doctor_id` o `is_case_collaborator` per i medici.
- [x] Revocati i permessi di esecuzione pubblica sulle funzioni sensibili (es: helper RLS come `is_case_collaborator`).
- [x] Utilizzo di `search_path = public` nelle funzioni critiche (`SECURITY DEFINER`) per evitare attacchi injection sul path.

## 3. Gestione Dati Sensibili
- [x] `SUPABASE_SERVICE_ROLE_KEY` utilizzata esclusivamente in contesti server-side (es. per modificare i ruoli senza RLS o by-passare dove necessario in API chiuse).
- [x] Documenti medici protetti: visibili solo a membri autorizzati tramite RLS o URL firmati temporaneamente.
- [x] I bucket Storage (`documents`) sono privati e hanno policy RLS in linea con quelle delle pratiche (il prefisso path è `{case_id}`).
- [x] Revocato il permesso di aggiornare dati anagrafici altrui per ruoli non admin/operator.

## 4. Input Validation e API
- [x] Input e parametri URL (come `redirect_to`) validati tramite la funzione `getSafeRedirect` per prevenire l'Open Redirect.
- [x] Rate limiting applicato (es. API chat `/api/chat`).
- [x] Validazione dei messaggi chat per evitare di esaurire la memoria (limiti sul numero di messaggi e sulla lunghezza).
- [x] Limitazione dell'import CSV (massimo 5MB e 2000 righe per volta).

## 5. Prevenzione Hallucinations AI
- [x] Il bot AI non è autorizzato a fornire diagnosi mediche (sancito nel prompt system).
- [x] Il retrieval dei dati (RAG) passa tramite RLS prima di arrivare all'AI: l'AI vede solo ciò che l'utente può vedere.

## 6. Audit & Log
- [x] Tabella `audit_logs` e/o versioning dove necessario per tracciare operazioni critiche (migrazione implementata precedentemente).
