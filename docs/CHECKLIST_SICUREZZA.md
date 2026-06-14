# Checklist Sicurezza Avanzata - CRM Patronato e CAF

Questa checklist raccoglie tutte le pratiche e le verifiche di sicurezza implementate nel sistema. Da consultare periodicamente o ad ogni rilascio importante.

## 1. Autenticazione (Supabase Auth)
- [x] L'onboarding utente crea profili in stato `pending` con ruolo minimo e senza organizzazione assegnata, prevenendo l'accesso ai dati aziendali.
- [x] I ruoli e lo stato dell'utente possono essere modificati solo da un amministratore attivo (`is_active_admin()`) tramite la funzione protetta `approve_member()`.
- [x] La chiave `service_role` non viene **mai** esposta lato client. È utilizzata esclusivamente nelle API o Server Actions.
- [x] Protezione dall'escalation di privilegi: la policy UPDATE sulla tabella `profiles` limita le modifiche autonomiche esclusivamente al campo `full_name`.

## 2. Row Level Security (RLS)
- [x] L'RLS è **abilitata** su tutte le tabelle operative (`organizations`, `profiles`, `contacts`, `cases`, `documents`, `tasks`, `medical_certificates`, tabelle knowledge base e AI).
- [x] Nessuna policy `SELECT` o `UPDATE` confronta `organization_id = auth.uid()` in maniera errata (Fix migrazione 0007 / 0018).
- [x] Isolamento Multi-Tenant: le tabelle operative filtrano i record tramite `organization_id` per garantire che gli utenti di un'organizzazione non possano accedere ai dati di un'altra.
- [x] Accesso granulare collaboratori e medici: i collaboratori interni e i medici esterni accedono **esclusivamente** ai record (`cases`, `tasks`, `documents`, `invalidity_details`, `medical_certificates`) a cui sono stati esplicitamente assegnati o invitati (migrazioni 0016 e 0018).
- [x] Le funzioni di supporto per RLS (`is_case_collaborator`, `is_org_member_of_case`) sono configurate come `SECURITY DEFINER` e i permessi `EXECUTE` sono revocati ai ruoli pubblici (`anon` e `public`), esponendoli solo ad `authenticated`.

## 3. Storage
- [x] I documenti sensibili dei clienti risiedono in un bucket privato (`documents`) e non sono pubblicamente accessibili.
- [x] Download e visualizzazione dei documenti avvengono esclusivamente tramite URL firmati temporanei (signed URLs).
- [x] Storage RLS (migrazione 0013): le policy sul bucket storage consentono l'accesso in lettura, inserimento, aggiornamento e cancellazione **solo** ai membri dell'organizzazione proprietaria della pratica, dedotta dal path `{case_id}/`.

## 4. API Routes e Server Actions
- [x] Tutte le API verificano la sessione (`supabase.auth.getUser()`) prima di eseguire operazioni.
- [x] Le API di inserimento/modifica verificano i ruoli se richiesto (es. solo `admin` per impostazioni app).
- [x] Le chiavi esterne (es. OpenRouter API Key) configurate dall'applicazione sono archiviate in tabella con RLS admin-only e lette dal backend in service role, senza mai inviarle al frontend (migrazione 0025).

## 5. Assistente AI e Dati Sensibili
- [x] L'Assistente AI opera su dati filtrati dall'RLS (il contesto generato per l'utente in sessione contiene solo le pratiche visibili all'utente stesso).
- [x] Le chiamate di embedding (Edge Function Supabase) per i documenti TARI e le knowledge base interne non richiedono chiavi esterne per RAG locale (uso gte-small, JWT verificato).
- [x] Direttiva fissa del prompt di sistema: l'assistente "non deve mai fornire diagnosi mediche" per questioni di sicurezza del dominio.

## 6. Funzioni Database
- [x] Impostato `search_path = ''` o `search_path = 'public'` per tutte le funzioni `SECURITY DEFINER` per mitigare rischi legati all'impostazione arbitraria del search path da parte di attori malevoli.
- [x] Permessi granulari su Postgres: le estensioni (come pgvector) sono esposte ma limitatamente ai flussi di competenza.

## 7. Audit Log
- [x] Una tabella dedicata (`audit_log`) raccoglie le modifiche (`INSERT`, `UPDATE`, `DELETE`) effettuate sulle tabelle critiche (`cases`, `contacts`, `documents`) con timestamp e utente responsabile (migrazione 0015).
- [x] Il registro attività (pagina Audit) permette di verificare le variazioni ai dati applicativi critici.
