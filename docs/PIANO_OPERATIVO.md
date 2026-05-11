# Piano Operativo e Analisi Architetturale - CRM CAF/Patronato

Questo documento definisce l'analisi di dominio, l'architettura tecnica, lo schema del database, la strategia di sicurezza (RLS) e il piano di sviluppo a fasi per il nuovo CRM proprietario dello studio CAF/Patronato (Centro Pratiche Flaiano).

**Nota:** Questo documento risponde al Prompt 0. Non include implementazioni di codice, ma costituisce le fondamenta per procedere con la Fase 1.

---

## 1. Analisi del Dominio

Il CRM è concepito per ottimizzare la gestione dei processi tipici di un CAF/Patronato, con particolarità nella gestione delle pratiche sanitarie come l'Invalidità Civile.

*   **Entità Principale:** Il **Cliente** (Persona Fisica). Un cliente può avere in carico contemporaneamente o storicamente molteplici **Pratiche**.
*   **Pratiche e Pipeline:**
    *   Le pratiche sono processi operativi separati assegnati al cliente.
    *   **CAF e Patronato:** Flusso unificato standard (raccolta documenti, verifica, invio, esito).
    *   **Invalidità Civile:** Pipeline dedicata e complessa (coinvolge il Medico Certificatore, visite INPS, AP70).
    *   **Colf e Badanti:** Pipeline dedicata (datore/lavoratore, MAV, contributi).
    *   **Lead/Appuntamenti:** Flusso di prevendita o primo contatto.
*   **Ruoli e Attori:**
    *   **Admin/Responsabile:** Controllo completo.
    *   **Operatore:** Gestione delle pratiche assegnate o del team.
    *   **Collaboratore Esterno:** Visibilità limitata alle pratiche/contatti delegati.
    *   **Medico Certificatore:** Accesso strettamente limitato alle sole pratiche di Invalidità Civile a lui assegnate e alla relativa documentazione sanitaria. Nessun accesso ad altre funzioni.
*   **Gestione Documentale:** Archiviazione sicura (Privata) con firme, scadenze, stati di acquisizione (es. *incompleti*, *completati*). I documenti devono alimentare anche il sistema RAG.
*   **Intelligenza Artificiale (RAG & Memoria Operativa):**
    *   L'AI assiste gli operatori recuperando informazioni procedurali dalla Knowledge Base e preferenze o promemoria dalla Memoria Operativa, effettuando RAG anche sui documenti (nel pieno rispetto dei permessi dell'utente).
    *   **Non** formula diagnosi mediche.

---

## 2. Architettura del Progetto

Il sistema segue un'architettura moderna orientata a serverless e edge computing:

*   **Frontend & Backend (Meta-Framework):** Next.js (App Router) in TypeScript con Tailwind CSS. Utilizzo di React Server Components (RSC) e Server Actions per un recupero dati rapido e sicuro.
*   **Database & Auth (BaaS):** Supabase (PostgreSQL). Fornisce autenticazione, gestione delle sessioni, database relazionale, Storage e Row Level Security (RLS).
*   **Storage:** Supabase Storage (Bucket Privato "documents" + URL firmati per l'accesso protetto).
*   **Intelligenza Artificiale:** OpenAI API (o provider equivalente). Generazione di embedding (salvati in PostgreSQL tramite `pgvector`) e interrogazioni contestualizzate con retrieval su base permessi.
*   **Hosting & CI/CD:** Vercel, per deploy fluidi, ambienti di preview, edge functions e auto-scaling.

### Struttura Cartelle Proposta
```text
/app               # Routing e Pagine Next.js (auth, dashboard, pratiche, ecc.)
/components        # Componenti UI (ui, layout, contatti, pratiche, ai, ecc.)
/lib               # Utility, client Supabase, helper AI/RAG, validatori (Zod)
/supabase          # Migrazioni DB, seed, policies SQL, edge functions
/types             # Definizione tipi TypeScript (Database, Domain)
```

---

## 3. Schema Database (Proposta)

Il modello dati utilizzerà UUID per le Primary Keys e si assicurerà di mantenere referenzialità (Foreign Keys). Ogni tabella sensibile avrà il campo `organization_id` per il multi-tenant interno (se necessario, altrimenti come base per policy).

**Tabelle Principali:**
*   `organizations`: Dati studio (Centro Pratiche Flaiano).
*   `profiles`: Estensione di `auth.users`, contiene ruolo, organizzazione e dettagli utente.
*   `contacts`: L'anagrafica cliente (Nome, CF, Contatti, Tags).
*   `cases` (Pratiche): Collegata a un `contact_id`. Campi: tipo, status, assegnatario, collaboratore, medico.
*   `pipelines` e `pipeline_stages`: Configurazione flussi.
*   `tasks`: Attività da completare, con scadenze, legate a una pratica o a un contatto.
*   `notes`: Appunti e note interne con logiche di visibilità (es. nascoste ai medici).
*   `documents`: Metadati dei file caricati (Storage), categoria e stato (OCR, Embedding).
*   `invalidity_details`: Tabella 1-to-1 con `cases` per i dati sanitari e date delle visite, referenziando il `doctor_id`.
*   `audit_logs`: Tracciamento immutabile delle operazioni critiche.
*   `knowledge_base`: Articoli e procedure.
*   `ai_memory_items`: Struttura operativa delle preferenze clienti o istruzioni della pratica.
*   `document_chunks`: Testo diviso e vettorizzato con `pgvector` per semantic search.

---

## 4. Strategia RLS (Row Level Security)

La RLS è l'elemento fondamentale per garantire isolamento e privacy, in particolare per i documenti sanitari. Non disattiveremo mai la RLS per bypassare errori.

*   **Regola Generale:** Tutte le policy devono includere `organization_id = user_organization_id()`. Nessun utente anonimo ha accesso in lettura/scrittura.
*   **Admin/Responsabile:** `SELECT/INSERT/UPDATE/DELETE` su tutte le tabelle per la propria organizzazione.
*   **Operatore:** Lettura su contatti e pratiche. Scrittura limitata o estesa a seconda delle necessità del team, ma filtrata per assegnazioni o ruolo operativo.
*   **Collaboratore Esterno:** `USING (collaborator_id = auth.uid() OR assigned_to = auth.uid())` su pratiche, task e documenti.
*   **Medico:** `USING (doctor_id = auth.uid())` per la tabella `cases` e relative query su `documents` categorizzati come medici. Nessun accesso all'elenco generale dei clienti o altre pratiche.
*   **Storage (Bucket "documents"):** Lettura e Scrittura limitate via RLS (`storage.objects`) accoppiate a logica applicativa (`signed URLs`).
*   **RAG:** Le query `pgvector` su `document_chunks` o `ai_memory_items` includeranno una pre-filtrazione RLS in base al `auth.uid()` prima della ricerca di similarità, per evitare che l'AI "legga" documenti a cui l'utente non ha accesso.

---

## 5. Piano di Sviluppo a Fasi

Il progetto sarà sviluppato seguendo passaggi atomici e verificabili. Non si passerà alla fase successiva se la corrente non passa lint, test base e build.

*   **Fase 1: Setup Progetto** (Next.js, Tailwind, Supabase Client, struttura cartelle, .env, UI login).
*   **Fase 2: Schema Database e Migrazioni** (Struttura SQL iniziale, UUID, foreign keys, pgvector).
*   **Fase 3: RLS e Sicurezza** (Implementazione delle policy e dei filtri ruoli).
*   **Fase 4: Autenticazione e Profili** (Login, redirect basati sul ruolo, gestione utenti).
*   **Fase 5: UI Base e Dashboard** (Layout, navigazione, KPI e statistiche).
*   **Fase 6: Modulo Contatti** (CRUD clienti, ricerca, audit logging).
*   **Fase 7: Modulo Pratiche e Pipeline** (Gestione flussi di lavoro, drag&drop, assegnazioni).
*   **Fase 8: Task e Note** (Task automatici, assegnazioni, note condivise/private).
*   **Fase 9: Gestione Documentale** (Supabase Storage privato, metadati, URL firmati).
*   **Fase 10: Modulo Invalidità Civile** (Dettagli sanitari, AP70, dashboard medico).
*   **Fase 11: Modulo Collaboratori e Medici** (Viste limitate e dashboard esterne).
*   **Fase 12: Knowledge Base** (Creazione articoli e preparazione all'indicizzazione).
*   **Fase 13: Intelligenza Artificiale, RAG e Memoria** (AI chat, embedding documenti, ricerca semantica protetta).
*   **Fase 14-16: Automazioni, Comunicazioni e Ricerca** (Workflow automatici, template messaggi, ricerca globale protetta).
*   **Fase 17-20: Test, Deploy, Import e Ottimizzazioni UX** (Audit di sicurezza, setup Vercel/Produzione, import CSV, UI per operatori).

---

## 6. Rischi Tecnici e Sicurezza

1.  **Fuga di Dati Sensibili (Documenti Medici):** Il rischio più alto. Mitigazione: RLS rigorosa su DB e Storage, URL temporanei, audit test specifici prima della produzione.
2.  **Esposizione Service Role Key:** Uso accidentale nel frontend. Mitigazione: Validazioni nel file `.env` (solo `NEXT_PUBLIC_` per variabili sicure), code review, divieto di export lato client.
3.  **Allucinazioni AI / Diagnosi errate:** L'AI potrebbe fornire informazioni non vere. Mitigazione: Prompt system stringenti ("Non sei un medico. Se non trovi il dato, dillo. Rispondi solo in base al contesto recuperato").
4.  **Bypass RAG:** L'AI estrae informazioni da documenti non autorizzati. Mitigazione: Filtro hardcoded su `auth.uid()` nei resolver SQL delle query vettoriali.
5.  **Corruzione Stato Pipeline:** Errori nelle automazioni (es. loop infiniti di task). Mitigazione: Disaccoppiamento degli eventi, limiti di logica (es. trigger idempotent).

---

### Criteri di Accettazione per il Piano Operativo
- [x] Documento prodotto e archiviato.
- [x] Analisi completa secondo i requisiti del CAF/Patronato.
- [x] Database, RLS e Architettura delineati e chiari.
- [x] Rispettati i principi base (nessun mockup, AI controllata, ruoli rispettati).
