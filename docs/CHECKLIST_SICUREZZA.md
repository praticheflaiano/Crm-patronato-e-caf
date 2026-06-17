# Checklist Sicurezza Avanzata

Questo documento funge da riferimento per la validazione della sicurezza architetturale e applicativa del CRM.
Prima di un deploy in produzione, ogni punto deve essere validato positivamente.

## 1. Database (PostgreSQL / Supabase)
- [ ] **Row Level Security (RLS)**: Tutte le tabelle operative (`contacts`, `cases`, `documents`, `tasks`, `medical_certificates`, ecc.) hanno RLS abilitata e policy di isolamento per `organization_id` applicate e testate per tutti i ruoli CRUD (Select, Insert, Update, Delete).
- [ ] **Update con RLS**: Quando si scrivono policy `UPDATE`, la clausola `WITH CHECK` rispecchia o restringe appropriatamente le condizioni della clausola `USING` per prevenire modifiche non autorizzate (ad es. cambio di `organization_id` fraudolento).
- [ ] **Hardening delle Funzioni Helper**: Funzioni custom in `public` o `auth` come `rls_auto_enable`, trigger o utilità utilizzano il `SECURITY DEFINER` solo dove strettamente necessario e revocano l'`EXECUTE` ai ruoli non previsti (es. public, anon).
- [ ] **Search Path Pinned**: Alle funzioni sensibili in PL/pgSQL è applicato `SET search_path = ''` per evitare attacchi di iniezione schema (security advisor di Supabase).
- [ ] **Join Ottimizzati e Relazioni Sicure**: Le foreign key che referenziano gli utenti puntano a `public.profiles(id)` e non direttamente a `auth.users(id)` per sfruttare l'esposizione RLS e unire in sicurezza su PostgREST.

## 2. Autenticazione (Supabase Auth)
- [ ] **Protezione delle Chiavi**: `SUPABASE_SERVICE_ROLE_KEY` è strettamente contenuta e accessibile solo in server-side/Route Handlers API (o tramite file come `src/utils/supabase/server.ts`). Mai esporla ai client.
- [ ] **Assegnazioni Ruoli in Sicurezza**: L'aggiornamento dei campi di autorizzazione sensibili in `public.profiles` (`role`, `status`, `organization_id`) è bloccato da RLS/Revoke standard. Le modifiche avvengono solo tramite apposite funzioni `SECURITY DEFINER` invocate da amministratori (es. `approve_member()`).
- [ ] **Gestione "Pending" / Invitati**: Ogni nuovo utente auto-registrato nasce in stato `pending` o privo di permessi, bloccato dalle policy operative fino all'approvazione di un admin.

## 3. Storage
- [ ] **Bucket Privati**: I documenti, in particolare referti medici o documenti identificativi, sono salvati nel bucket privato `documents`.
- [ ] **Isolamento per Path e RLS in Storage**: Le policy del bucket limitano l'accesso tramite regole sul prefisso del percorso (es. `case_id/`) o tramite join alle tabelle applicative, impedendo a utenti di un'organizzazione (o a medici non assegnati) l'accesso a file di altre pratiche.
- [ ] **Signed URLs**: L'accesso in lettura per i bucket privati è gestito unicamente tramite URL temporanei e firmati.

## 4. Edge Functions / API Routes (Next.js)
- [ ] **Autenticazione Endpoint**: Tutte le API in `src/app/api` recuperano e validano correttamente l'utente tramite il client Supabase SSR prima di compiere qualsiasi azione, restituendo un errore 401/403 se assente o invalido.
- [ ] **Controlli Accesso**: Oltre all'autenticazione, si verifica che il profilo disponga del ruolo necessario (es. `admin` per endpoint di export totale).
- [ ] **Rate Limiting**: Endpoint esposti e costosi come `/api/chat` implementano controlli sui payload (es. messaggi troppo lunghi) e limitazioni best-effort (rate limiting) per limitare abusi o sprechi di API keys (es. verso OpenAI/OpenRouter).

## 5. Intelligenze Artificiali & Memoria Operativa (AI/RAG)
- [ ] **No Hallucinations/Diagnostic**: I prompt di sistema vietano categoricamente all'AI di emettere diagnosi mediche o considerazioni cliniche.
- [ ] **RAG Sicuro (Pre-filtrato)**: Le query a `pgvector` pre-filtrano sistematicamente a livello SQL i chunk estratti considerando sempre la RLS sull'`organization_id` dell'utente e, se presente, il controllo `assigned_to` o ruolo, per impedire fughe di dati inter-organizzativi.
- [ ] **Limiti di Memoria su Edge**: Le Edge Functions dedicate alla creazione degli embeddings raggruppano i processi in batch limitati (es. max 4-8) per non incappare nell'errore `HTTP 546 WORKER_RESOURCE_LIMIT`.

## 6. Audit & Logica Frontend
- [ ] **Tracciamento Modifiche**: Operazioni critiche (cambio stato, note pratiche) sono loggate (es. via `task_notes` o tabelle di audit esplicite) per tracciamento azioni/utenti.
- [ ] **Immutabilità array lato client**: Codice JavaScript/TypeScript client utilizza metodi sicuri come `toSorted()` o spread operator per non mutare le state array.

Data ultima validazione: *Inserire qui la data della verifica completa.*