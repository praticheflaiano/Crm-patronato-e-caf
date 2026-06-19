# Checklist di Sicurezza - CRM CAF/Patronato

Questo documento descrive le linee guida e le configurazioni di sicurezza obbligatorie e raccomandate per il sistema. Il CRM gestisce dati altamente sensibili (documenti sanitari, dati personali, codici fiscali) che richiedono una protezione rigorosa in ogni livello dell'architettura.

## 1. Supabase Auth

*   [x] **MFA (Multi-Factor Authentication):** Consigliato abilitare e incoraggiare l'uso del 2FA per tutti gli account con ruolo `admin` e `operator`.
*   [x] **Disabilitare Registrazioni Pubbliche (Opzionale ma consigliato):** Se l'istanza è privata per un singolo studio, disabilitare le iscrizioni pubbliche in Supabase Auth > Impostazioni > Email, consentendo solo gli inviti da parte degli admin.
*   [x] **Password Forti:** Assicurare che la policy per le password in Supabase richieda almeno 12 caratteri, lettere minuscole, maiuscole, numeri e simboli.
*   [x] **Hardening Tabella `profiles`:** Evitare la modifica autonoma di campi critici come `role`, `organization_id` e `status` da parte degli utenti. Le policy `UPDATE` su `profiles` devono permettere all'utente di modificare solo campi non critici come `full_name`. I campi critici vanno modificati tramite funzioni RPC `SECURITY DEFINER` o dall'admin.

## 2. RLS (Row Level Security)

*   [x] **RLS Attiva Ovunque:** RLS deve essere *sempre* abilitata su tutte le tabelle, specialmente `cases`, `contacts`, `documents`, `tasks` e relative sub-tabelle (`medical_certificates`, `invalidity_details`, `knowledge_documents`).
*   [x] **Isolamento Organizzazione (`organization_id`):** Tutte le policy devono includere una restrizione sul `organization_id` per garantire il multi-tenancy rigoroso, assicurando che gli utenti vedano solo i dati della propria organizzazione.
*   [x] **Ruolo Collaboratori ed Esterni:** Gli utenti con ruolo `collaborator` devono avere accesso *solo* alle pratiche a loro assegnate (`assigned_to = auth.uid()`).
*   [x] **Medici Certificatori:** Gli utenti con ruolo `doctor` devono avere un accesso strettamente limitato (tramite `case_collaborators` e `is_case_collaborator()`) alle sole singole pratiche in cui sono stati invitati.
*   [x] **Niente `service_role` nel Frontend:** La chiave `service_role` garantisce poteri assoluti ignorando l'RLS. Non deve MAI essere inviata al client, ma limitata a server actions e routes API.
*   [x] **`WITH CHECK` coerente con `USING`:** Nelle policy `UPDATE`, assicurarsi che le clausole `WITH CHECK` replichino rigorosamente le restrizioni della clausola `USING`, prevenendo modifiche non autorizzate ai campi di isolamento.

## 3. Storage (Bucket dei Documenti)

*   [x] **Storage Privato:** Il bucket `documents` non deve essere impostato come "Public".
*   [x] **Isolamento Organizzativo nello Storage:** L'accesso al bucket (SELECT, INSERT, UPDATE, DELETE) deve essere limitato in RLS usando policy che verifichino che l'utente faccia parte dell'organizzazione proprietaria della pratica (spesso estraendo il `case_id` dal path del file).
*   [x] **Signed URLs (Scaricamento):** Per il download o la visualizzazione dei documenti, utilizzare sempre Signed URLs temporanei con scadenza breve, generati sul server (o sul client se la RLS sul bucket è correttamente configurata).

## 4. API Routes e Next.js Server Actions

*   [x] **Autenticazione lato Server:** Ogni API Route e Server Action deve iniziare verificando la sessione utente (`supabase.auth.getUser()`).
*   [x] **Verifica Ruolo Server-Side:** Non fidarsi mai della UI per nascondere pulsanti. Tutte le Server Action e gli Endpoint che eseguono azioni privilegiate (es. cambiare stato utente, creare nuove tabelle/configurazioni) devono riverificare il ruolo (`admin`, `operator`) interrogando `profiles` lato server.
*   [x] **Rate Limiting:** Implementare rate limiting per endpoint sensibili o costosi (es. `/api/chat`, `/api/knowledge`) per prevenire abusi sui token API e sui costi di embedding.
*   [x] **Validazione Input (Zod):** Validare sempre l'input inviato dal client contro uno schema rigido prima di utilizzarlo in una query o API di terze parti.

## 5. Edge Functions e Intelligenza Artificiale

*   [x] **JWT Verification per Edge Functions:** Assicurarsi che le Edge Functions non siano invocabili in modo anonimo, verificando sempre l'header di autorizzazione (come configurato di default in Supabase Functions).
*   [x] **Limiti di Risorse (Embedding):** Funzioni come l'embedding (`gte-small`) esauriscono rapidamente la memoria in esecuzione Edge. Elaborare i testi a piccoli batch (es. 4 chunk per volta) per evitare `HTTP 546 WORKER_RESOURCE_LIMIT`.
*   [x] **RAG Scoped (Isolamento RAG):** Le interrogazioni semantiche (`pgvector` e Edge Functions) devono sempre includere clausole RLS (o condizioni `organization_id`) *prima* della ricerca di similitudine per impedire l'estrazione di informazioni da documenti di altre organizzazioni.
*   [x] **Sicurezza delle API Keys Esterne:** Le chiavi esterne (OpenAI, OpenRouter) vanno conservate nelle variabili d'ambiente in modo sicuro (`.env.local` e in Vercel/Supabase settings), o all'interno di tabelle di impostazioni accessibili solo dal `service_role_key` lato server. Non devono mai essere esposte con prefisso `NEXT_PUBLIC_`.
*   [x] **Contenimento Modelli AI:** Ricordare nel System Prompt dell'AI che il sistema non deve fornire diagnosi mediche o deduzioni cliniche, specialmente perché manipola documenti di Invalidità Civile.

## 6. Audit Logging

*   [x] **Tracciamento Modifiche (Audit Logs):** Azioni critiche come creazione pratiche, cancellazione clienti, assegnazione collaboratori e caricamento documenti sanitari devono produrre righe in `audit_logs` con indicazione dell'utente responsabile e timestamp, ai fini della tracciabilità organizzativa e conformità GDPR.
