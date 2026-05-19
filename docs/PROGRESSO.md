# Progresso CRM Patronato e CAF

Ultimo aggiornamento: 2026-05-12

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
- Tabelle operative:
  - `organizations`
  - `profiles`
  - `contacts`
  - `cases`
  - `documents`
  - `tasks`
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
- Chat AI presente come base, ma non ancora RAG.
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
5. Task e note. Completato.
6. RLS avanzata per admin, operatori, collaboratori e medici. Da fare.
7. Modulo Invalidita Civile. Da fare.
8. Knowledge base. Da fare.
9. Assistente AI con RAG protetto. Da fare.
10. Import CSV, deploy produzione e checklist sicurezza. Da fare.

## Team agenti attivo

- Worker Pipeline: stati pratica, label, badge e flusso avanzamento. Integrato.
- Worker Documenti: upload su bucket `documents`, metadati e signed URL. Integrato.
- Worker UX CRUD: uniformare form e stati vuoti. Integrato.
- Worker Task & Note: gestione task e note su pratica. Integrato.

## Prossimo obiettivo operativo

Integrare i prossimi step in questo ordine:

1. RLS avanzata per collaboratori e medici.
2. Modulo Invalidita Civile.

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
