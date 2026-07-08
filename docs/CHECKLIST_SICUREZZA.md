# Checklist di Sicurezza

Questo documento contiene le direttive di sicurezza e le verifiche per il sistema CRM CAF/Patronato, con particolare attenzione alla protezione dei dati sanitari (es. Invalidità Civile) e alle best practice per l'implementazione su Supabase (Next.js App Router).

## 1. Configurazione Supabase e Chiavi
- [x] **Service Role Key:** Non deve MAI essere esposta al client o inserita in variabili prefixate con `NEXT_PUBLIC_`. Usarla solo in endpoint server-side o server actions critiche, isolando l'uso in moduli helper dedicati (es. `src/utils/supabase/server.ts`).
- [x] **Anon/Publishable Key:** Configurare `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` per le chiamate lato client.

## 2. Row Level Security (RLS)
- [x] **Abilitazione Globale:** La RLS deve essere abilitata su TUTTE le tabelle (non usare mai `alter table ... disable row level security`).
- [x] **Politiche per Tenant:** Ogni tabella operativa (`contacts`, `cases`, `tasks`, `documents`, ecc.) deve avere una colonna `organization_id` e policy che forzano l'accesso solo ai membri dell'organizzazione (tramite join con `profiles`).
- [x] **Validazione Scrittura (`WITH CHECK`):** Qualsiasi policy `UPDATE` o `INSERT` deve validare che i dati inseriti/modificati corrispondano all'organizzazione dell'utente (e.g. `WITH CHECK (organization_id = ...)`). Questo evita che utenti manipolino i payload per scrivere dati in altre organizzazioni.
- [x] **Permessi Granulari per Ruoli:**
  - `admin`, `operator`: Accesso in lettura/scrittura all'intera organizzazione.
  - `collaborator`: Lettura/scrittura limitata alle pratiche a lui assegnate (via `assigned_to`).
  - `doctor`: Lettura limitata *esclusivamente* alle pratiche a lui assegnate (e ai relativi dati medici/documenti). Non deve poter leggere contatti o pratiche non sue.
- [x] **Prevenzione Ricorsione Infinita:** Quando si scrivono policy sulla tabella `profiles` che filtrano per `organization_id`, evitare subquery dirette su `profiles`. Usare l'approccio JWT (se l'org è nei claim) o funzioni `SECURITY DEFINER` per bypassare temporaneamente la RLS durante il recupero.

## 3. Gestione Documentale (Supabase Storage)
- [x] **Bucket Privati:** I bucket contenenti documenti sensibili (es. `documents`) devono essere **privati**.
- [x] **Scoping dei Path:** I file devono essere caricati in path strutturati, tipicamente `{case_id}/filename.ext`.
- [x] **RLS su Storage:** Implementare policy RLS sulla tabella `storage.objects` che verifichi l'accesso dell'utente alla pratica (es. tramite il prefisso del nome del file che contiene l'ID della pratica).
- [x] **URL Temporanei:** Non restituire mai URL pubblici. Generare sempre URL firmati (Signed URLs) a scadenza breve per il download/visualizzazione dei file.

## 4. API Routes e Server Actions
- [x] **Autenticazione Obligatoria:** Verificare sempre la sessione e l'utente prima di eseguire qualsiasi logica.
- [x] **Validazione Input (Zod):** Validare e sanificare rigorosamente tutti i payload in ingresso.
- [x] **Rate Limiting:** Implementare rate limiting sugli endpoint sensibili (es. AI/Chat, login) per prevenire abusi e contenere i costi (vedi `/api/chat`).
- [x] **Protezione Open Redirect:** Quando si gestiscono redirect basati su parametri (es. dopo il login), validare sempre che l'URL di destinazione sia sicuro (appartenente al dominio) tramite l'utility `getSafeRedirect`.

## 5. Intelligenze Artificiali (AI e RAG)
- [x] **Limiti Medici:** L'AI non deve mai fornire diagnosi mediche. Questo deve essere specificato esplicitamente nel system prompt.
- [x] **Isolamento RAG:** Le query vettoriali (`pgvector`) devono sempre includere clausole RLS (o filtri lato applicazione post-recupero) per garantire che l'AI "legga" e usi solo informazioni a cui l'utente ha effettivamente accesso.
- [x] **Limiti Edge Functions:** Ottimizzare i batch di embedding per evitare errori di timeout o memory limit (es. `WORKER_RESOURCE_LIMIT`) nelle Edge Functions Deno di Supabase.

## 6. Audit e Tracciabilità
- [x] **Log delle Modifiche:** Le modifiche critiche (es. cambio di stato di una pratica, caricamento documenti medici) dovrebbero essere tracciate in tabelle di log (es. `audit_logs`).
