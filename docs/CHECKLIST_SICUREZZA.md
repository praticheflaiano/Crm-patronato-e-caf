# Checklist Sicurezza CRM Patronato e CAF

Questo documento elenca le linee guida e i controlli di sicurezza implementati nel CRM per garantire la protezione dei dati, con particolare attenzione alle pratiche mediche e ai documenti sensibili.

## 1. Autenticazione (Auth)

*   **Provider:** Supabase Auth (Email/Password).
*   **Gestione Sessioni:** Next.js Server Components e Middleware usano `@supabase/ssr` per il controllo centralizzato delle sessioni sui cookie. Nessun check puramente lato client bypassabile.
*   **Creazione Utenti:** Nuovi utenti vengono creati come `pending` senza permessi operativi. Devono essere approvati da un `admin` tramite funzione `security definer`.

## 2. Row Level Security (RLS)

*   **Isolamento Multi-tenant:** Ogni tabella operativa (`contacts`, `cases`, `tasks`, ecc.) possiede una colonna `organization_id`.
*   **Policy di Base:** Tutte le policy (Select, Insert, Update, Delete) filtrano per `organization_id = current_user_org_id()` dove la funzione `current_user_org_id()` (Security Definer) restituisce l'org_id del profilo utente `active`.
*   **Regola WITH CHECK:** Per le policy `UPDATE`, assicurarsi che la clausola `WITH CHECK` rifletta strettamente la clausola `USING` per impedire la manipolazione non autorizzata di campi protetti (es: impedire che un operatore cambi la pratica di organizzazione).
*   **Regola d'Oro:** RLS deve essere abilitata su TUTTE le tabelle e non deve MAI essere disabilitata (neanche temporaneamente per debug).
*   **Ruoli Specifici:** L'accesso a cartelle/pratiche sensibili per i medici è gestito dalla tabella associativa `case_collaborators` e dalla funzione `is_case_collaborator()`.

## 3. Storage (Documenti)

*   **Bucket Privato:** Il bucket `documents` di Supabase è rigorosamente privato.
*   **Accesso ai File:** I download diretti non sono consentiti. I file vengono serviti esclusivamente tramite **Signed URLs** generati on-demand lato server dopo aver verificato i permessi dell'utente sulla specifica pratica (usando policy che limitano l'accesso in base a `organization_id` tramite prefisso del file path `{case_id}/`).
*   **Isolamento:** I path dei file devono includere il `case_id` per garantire che l'appartenenza a un'organizzazione sia verificabile tramite l'albero delle directory/file.

## 4. API Routes e Server Actions (Next.js)

*   **Validazione Dati:** Tutti gli input utente passati ad API routes o Server Actions devono essere validati tramite librerie robuste (es. Zod) prima di interrogare il database.
*   **Rate Limiting:** Implementato rate limiting custom best-effort su endpoint critici (es: `/api/chat`) per prevenire abusi o esaurimento token LLM.
*   **Prevenzione Open Redirect:** L'uso della funzione `getSafeRedirect()` (`src/utils/url.ts`) è **obbligatorio** per i reindirizzamenti basati sull'input dell'utente (come i parametri `redirect_to` nel login) per prevenire attacchi di phishing/open redirect.
*   **Protezione Chiavi:** La Service Role Key di Supabase è usata *esclusivamente* lato server (`createAdminClient`) in casi molto specifici (es. lettura di impostazioni per tenant). Chiavi pubbliche devono sempre avere il prefisso `NEXT_PUBLIC_`.

## 5. Edge Functions

*   **Controllo Limiti Memoria:** Funzioni Edge pesanti (come l'embedding `gte-small`) soffrono i limiti del runtime (`HTTP 546 WORKER_RESOURCE_LIMIT`). Suddividere sempre i caricamenti massivi in piccoli batch (es. massimo 4-8 testi alla volta) e cap i limiti lato funzione (vedi `embed`).
*   **Autenticazione Edge:** Le chiamate alle Edge Function devono essere effettuate dal client Supabase autenticato per propagare il JWT, che la funzione deve validare.

## 6. Sicurezza Applicativa Generale (LLM/AI)

*   **Divieto di Diagnosi:** L'assistente AI ha il divieto rigoroso via prompt di sistema di fornire diagnosi mediche, commentare quadri clinici o allucinare documenti.
*   **RAG Limitato (Context Hardening):** Prima che i testi (Knowledge Base o Note) vengano inviati all'LLM, i dati sono filtrati a monte da query SQL protette da RLS. L'LLM "vede" solo ciò che l'utente può già vedere nell'interfaccia.

## 7. Audit Logging (Da Monitorare)

*   Eventuali azioni distruttive (es. cancellazione di utenti, pratiche) o aggiornamenti critici (es. cambi di stato medico) dovrebbero preferibilmente tracciare "chi ha fatto cosa" (vedi tabella `audit_log` o future implementazioni simili).
