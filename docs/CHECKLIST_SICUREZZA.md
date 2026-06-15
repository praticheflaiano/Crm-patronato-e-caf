# Checklist Sicurezza CRM Patronato e CAF

Questo documento contiene la checklist per verificare la sicurezza del sistema, coprendo Autenticazione, Row Level Security (RLS), Storage, API Routes e Edge Functions.

## 1. Autenticazione & Profili (Auth)
- [ ] **Registrazione:** Gli utenti creati nascono con `status = 'pending'`, senza `organization_id` e ruolo minimo (`operator`), grazie al trigger `on_auth_user_created`.
- [ ] **Escalation di Privilegi Prevenuta:** La tabella `profiles` ha RLS. I campi sensibili (`role`, `organization_id`, `status`) hanno un `REVOKE INSERT/UPDATE` per `authenticated`. Gli utenti possono aggiornare solo `full_name`. L'approvazione avviene solo tramite la funzione `security definer` `approve_member()` richiamabile solo da un `admin`.
- [ ] **Esposizione Chiavi:** La `service_role` key non è mai esposta al frontend. Le chiavi pubbliche hanno il prefisso `NEXT_PUBLIC_`.
- [ ] **Gestione Password:** Implementato controllo robustezza password o provider esterni sicuri abilitati in Supabase.

## 2. Row Level Security (RLS)
- [ ] **Attivazione Obbligatoria:** RLS è attiva su tutte le tabelle. Non disattivare mai RLS per risolvere errori di accesso.
- [ ] **Isolamento Organizzazioni:** Le tabelle operative (es. `contacts`, `cases`, `tasks`) hanno policy `organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())` per impedire leak cross-tenant.
- [ ] **Accesso Collaboratori:** `is_case_collaborator` definisce l'accesso corretto per i collaboratori e medici assegnati alle pratiche.
- [ ] **Accesso Medici:** I medici hanno accesso rigorosamente solo alle pratiche di Invalidità Civile a loro assegnate, tramite join sicuro.
- [ ] **Limitazione UPDATE `WITH CHECK`:** Quando si scrivono policy `UPDATE`, assicurarsi che le condizioni `USING` riflettano coerentemente la clausola `WITH CHECK` (o che quest'ultima restringa in modo sicuro) per prevenire modifiche non autorizzate su ID o organizzazioni protette.

## 3. Storage Documenti (Storage)
- [ ] **Accesso Bucket Privato:** Il bucket `documents` è configurato come privato.
- [ ] **URL Firmati:** Il download dei file dal frontend avviene esclusivamente tramite signed URLs temporanei per evitare condivisioni non autorizzate.
- [ ] **RLS su Oggetti:** Esistono policy applicate a `storage.objects` che verificano l'accesso in base al ruolo dell'utente (`organization_id`, appartenenza alla pratica).
- [ ] **Limitazioni Upload:** I tipi di file permessi e le dimensioni massime sono strettamente definiti per evitare caricamenti di file nocivi.

## 4. API Routes e Server Actions (Next.js)
- [ ] **Validazione Input:** Tutte le API routes validano in modo stretto gli input (es. con Zod) per difendersi da SQL Injection o dati malformati.
- [ ] **Controlli Autenticazione:** Ogni rotta (inclusa l'export CSV e upload file) chiama `supabase.auth.getUser()` verificando attivamente la sessione.
- [ ] **Rate Limiting:** Rotte esposte o pesanti (come `/api/chat`) hanno un rate limiter (es. Redis o logica in-memory) per prevenire abusi (es. scraping AI, DDoS).
- [ ] **Server Actions Sicure:** Le mutazioni eseguite dalle Server Actions (es. `importCases`) controllano l'appartenenza all'organizzazione del chiamante per evitare azioni su tenant estranei.

## 5. Edge Functions e Intelligenza Artificiale (AI)
- [ ] **Edge Limits Rispettati:** Batch chunk limitati a piccoli slot (es. 4-8) nella funzione di embedding per evitare errori di limite di risorse sull'Edge di Supabase (es. HTTP 546 `WORKER_RESOURCE_LIMIT`).
- [ ] **Protezione JWT:** La funzione Supabase `embed` e altre edge functions richiedono obbligatoriamente un token JWT valido per prevenire esecuzioni anonime a pagamento.
- [ ] **RAG su Permessi:** Le query vettoriali (`pgvector`) effettuano filtri preventivi su `current_user_org_id()` impedendo al LLM di ricevere frammenti appartenenti ad altre organizzazioni.
- [ ] **Protezione Modelli e Privacy:** L'assistente AI non deve formulare diagnosi mediche (gestito nel System Prompt) ed è limitato al context retrieval dei soli file autorizzati.
- [ ] **Accesso Chiavi AI Server-Side:** La chiave `OPENROUTER_API_KEY` è configurata server-side e recuperata per l'organizzazione in modo sicuro (tramite DB RLS solo-admin o variabili d'ambiente).
