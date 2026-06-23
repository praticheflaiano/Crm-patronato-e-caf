# Checklist Sicurezza - CRM Patronato e CAF

Questa checklist deve essere utilizzata per garantire la sicurezza dell'applicazione in ogni fase dello sviluppo e del rilascio. È progettata per mitigare i rischi e assicurare l'isolamento corretto dei dati per il multi-tenant.

## 1. Database e Row Level Security (RLS)
- [ ] **RLS Abilitata**: Tutte le tabelle operative (`organizations`, `profiles`, `contacts`, `cases`, `tasks`, `documents`, `medical_certificates`, ecc.) hanno la Row Level Security (RLS) abilitata.
- [ ] **Isolamento Tenant**: Le policy operative implementano obbligatoriamente il controllo per organizzazione (es. `organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())`).
- [ ] **WITH CHECK su RLS UPDATE**: Tutte le policy di `UPDATE` includono clausole `WITH CHECK` che prevengono modifiche ai campi protetti (es. l'utente non deve poter cambiare il suo `organization_id` inviando un payload malevolo).
- [ ] **Isolamento Ruoli (RBAC)**:
    - *Admin*: può modificare ruoli e approvare accessi (`approve_member()`).
    - *Collaboratori/Medici*: hanno accesso ristretto solo alle pratiche o task assegnati. I medici possono vedere i dettagli clinici, ma non la lista completa anagrafica dell'organizzazione.

## 2. API e Server
- [ ] **Service Role Key Protetta**: `SUPABASE_SERVICE_ROLE_KEY` viene utilizzata esclusivamente in contesti backend (Server Actions / API Routes) e **non** è esposta nei client componenti. L'uso nel frontend è severamente vietato.
- [ ] **Variabili Client Sicure**: Solo le variabili strettamente necessarie espongono il prefisso `NEXT_PUBLIC_` (es. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
- [ ] **Validazione Input (API/Action)**: I dati inviati al server vengono validati (es. Zod, o check rigidi) prima di interazioni col database o con API esterne (es. OpenRouter).
- [ ] **Open Redirect Prevention**: Gli URL di ritorno, specialmente per il login (es. `redirect_to`), vengono sanificati e validati (es. tramite `getSafeRedirect()`).
- [ ] **Rate Limiting**: È implementato rate limiting sugli endpoint critici, in particolare sull'API di chat AI e sul modulo di login.

## 3. Storage
- [ ] **Storage Privato**: Il bucket dei documenti (es. `documents`) è configurato come privato. L'accesso anonimo è bloccato.
- [ ] **Policy Storage RLS**: L'accesso ai bucket di storage è mediato dalle stesse regole dei tenant applicando policy (es. il check RLS sull'organizzazione controllando la radice del filepath nel bucket per `case_id`).
- [ ] **URL Firmati**: I documenti, in particolare quelli sanitari, vengono forniti solo tramite URL firmati temporanei generati server-side o client-side autenticato.

## 4. Intelligenza Artificiale (AI/RAG)
- [ ] **Sicurezza del Contesto AI**: I chunk di testo forniti all'assistente AI sono prefiltrati in base alla RLS dell'utente. Il motore di embedding non ha accesso a documenti vietati al chiamante.
- [ ] **Nessun Dato Sensibile nei Log**: Le query di chat e le risposte AI non registrano passivamente PII cliniche o sensibili in console/log o verso OpenRouter (per quanto possibile mitigare).
- [ ] **Nessuna Diagnosi**: Il prompt base impone categoricamente all'AI di non produrre risposte configurabili come diagnosi cliniche.
- [ ] **Edge Function Memory Limits**: Le elaborazioni pesanti edge-side (es. modelli gte-small per embedding in Supabase Edge Functions) hanno batch limits stringenti (es. 4-8 items) per prevenire attacchi di tipo Denial of Service via saturazione della memoria (546 WORKER_RESOURCE_LIMIT).
