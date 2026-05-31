# Progresso CRM Patronato e CAF

Ultimo aggiornamento: 2026-05-26

## Repository e ambiente

- Repository GitHub: `https://github.com/praticheflaiano/Crm-patronato-e-caf.git`
- Branch principale: `main`
- Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase SSR
- Progetto Supabase: `Crm-patronato-e-caf`
- Supabase ref: `xjchklrrmyavizozhtpb`
- URL locale: `http://127.0.0.1:3000`
- Account operativo admin: `praticheflaiano@gmail.com`

## Stato completato

### Setup e pubblicazione

- Progetto locale collegato al repository GitHub.
- Dipendenze installate.
- `.env.local` configurato localmente con URL Supabase e chiave pubblicabile.
- `.env.example` aggiunto al repository.
- Build e lint verificati piu volte.

### Supabase

- Migrazioni applicate:
  - `0001_initial_schema.sql`
  - `0002_rls_policies.sql`
  - `0003_documents_storage_bucket.sql`
  - `0004_profiles_organizations_roles.sql`
  - `0005_profile_self_setup.sql`
  - `0006_fix_profiles_rls_recursion.sql`
- Migrazioni TARI/task note applicate e verificate sul database remoto:
  - `0010_tari_module.sql` (aggiunge `tari` all'enum `case_type`)
  - `0011_task_notes.sql`
  - `0012_rls_task_notes.sql`
- Tabelle operative:
  - `organizations`
  - `profiles`
  - `contacts`
  - `cases`
  - `documents`
  - `tasks`
  - `task_notes`
  - `medical_certificates`
- Bucket privato Supabase Storage:
  - `documents`
- RLS attiva sulle tabelle principali.
- Organizzazione creata:
  - `Centro Pratiche Flaiano`
- Ruoli definiti:
  - `admin`
  - `operator`
  - `collaborator`
  - `doctor`
- Utente `praticheflaiano@gmail.com` configurato come `admin`.

### App

- Login Supabase funzionante.
- Layout autenticato con sidebar, organizzazione e ruolo utente.
- Dashboard con conteggi reali da Supabase.
- Lista, creazione, dettaglio e modifica contatti.
- Lista, creazione, dettaglio e modifica pratiche.
- Cambio stato pratica.
- Task e note pratica integrati lato UI/API, con tipi locali allineati.
- Modulo Invalidita Civile integrato.
- Modulo TARI Roma/AMA integrato come case type nativo (`tari`), con portale `/tari`, scheda dettaglio `/tari/[id]`, fonti ufficiali AMA/Roma Capitale, checklist documentale e mappatura moduli.
- Chat AI collegata a OpenRouter via Vercel AI SDK; modello predefinito `minimax/minimax-m2.7`. RAG non ancora implementato.
- Tema chiaro stabile: rimosso il dark mode automatico che rendeva la UI nera/illeggibile.

## Decisioni importanti

- Non usare `service_role` nel frontend.
- Usare `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; supporto legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` resta nel codice.
- RLS non va disattivata per aggirare errori.
- I documenti sanitari reali vanno caricati solo dopo permessi avanzati e controllo accessi medico/collaboratore.
- Il RAG sui documenti va fatto solo dopo filtri RLS robusti.
- L'assistente AI non deve fornire diagnosi mediche.

## Sequenza di lavoro approvata

1. Profili, organizzazione e ruoli. Completato.
2. CRUD completo contatti e pratiche. Base completata.
3. Pipeline pratiche e stati strutturati. Base completata.
4. Documenti con upload/download privato. Base completata.
5. Task e note. Base implementata; migrazioni remote applicate e verificate.
6. RLS avanzata per admin, operatori, collaboratori e medici. Da consolidare.
7. Modulo Invalidita Civile. Integrato; testare con dati reali e RLS avanzata.
8. Knowledge base. Da fare.
9. Assistente AI OpenRouter implementato; RAG protetto da fare.
10. Import CSV e checklist sicurezza avanzata. Da fare.
11. Modulo TARI Roma/AMA. Integrato e migrazione `0010_tari_module.sql` applicata sul database remoto.

## Team agenti attivo

- Worker Pipeline: stati pratica, label, badge e flusso avanzamento. Integrato.
- Worker Documenti: upload su bucket `documents`, metadati e signed URL. Integrato.
- Worker UX CRUD: uniformare form e stati vuoti. Integrato.

## Prossimo obiettivo operativo

Integrare i risultati dei worker in questo ordine:

1. Consolidare RLS avanzata per collaboratori, medici e moduli verticali.
2. Collegare knowledge base/RAG ufficiale per TARI e altri servizi.
3. Aggiungere import CSV e checklist sicurezza avanzata.

## Comandi di verifica

```bash
npm run lint
npm run build
```

In caso di errore `EPERM` su `.next` in Windows/OneDrive:

1. fermare il server Next locale;
2. rimuovere solo la cartella `.next` del progetto;
3. rilanciare `npm run build`.

## Ultimi commit rilevanti

- `6f60367` - Polish CRM core screens
- `d4bc0d2` - Add roles and core CRUD flows
- `ca343ac` - Add project progress memory
- `ff5ea33` - Add workflow and document handling
