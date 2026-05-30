# CRM Patronato e CAF

Sistema CRM per la gestione pratiche di CAF, Patronato, Invalidità Civile e TARI Roma/AMA — costruito con Next.js 16, React 19, TypeScript, Tailwind CSS 4 e Supabase.

[![Build](https://github.com/praticheflaiano/Crm-patronato-e-caf/actions/workflows/ci.yml/badge.svg)](https://github.com/praticheflaiano/Crm-patronato-e-caf/actions)

---

## Descrizione del prodotto

Il CRM è uno strumento operativo multi-organizzazione pensato per centri di assistenza fiscale (CAF), patronati e servizi collegati. Centralizza la gestione di contatti, pratiche, documenti privati, task e comunicazioni, con moduli verticali dedicati a Invalidità Civile e TARI Roma/AMA.

Ogni dato è isolato per organizzazione tramite Row Level Security (RLS) di Supabase; i documenti sono archiviati in un bucket privato con URL firmati a scadenza. Un assistente AI integrato (OpenRouter) supporta gli operatori nell'analisi delle pratiche, senza mai fornire diagnosi mediche.

---

## Stack tecnologico

| Livello | Tecnologia |
|---------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Stile | Tailwind CSS 4 |
| Backend / DB | Supabase (Auth, PostgreSQL, Storage, RLS) |
| Form | React Hook Form + Zod |
| AI | OpenRouter via Vercel AI SDK — modello predefinito `minimax/minimax-m2.7` |
| Test | Jest + React Testing Library, Cypress (E2E) |
| Deploy | Vercel |

---

## Funzionalità principali

### Contatti
- Lista, creazione, modifica ed eliminazione contatti.
- Dettaglio contatto con pratiche associate.
- Export CSV dell'elenco contatti.

### Pratiche
- Lista, creazione, modifica ed eliminazione pratiche.
- Pipeline stati strutturata (workflow pratiche con label e badge).
- Filtro per tipo pratica (CAF, Patronato, Invalidità Civile, TARI).
- Dettaglio pratica con storico stati.
- Export CSV dell'elenco pratiche.

### Documenti privati
- Upload file su bucket Supabase Storage privato (`documents`).
- Download tramite URL firmati a scadenza.
- Accesso limitato ai membri dell'organizzazione proprietaria della pratica (path scoped per `case_id`).

### Task e note
- Creazione e gestione task collegati a una pratica.
- Note su task con storico.
- API dedicata (`/api/tasks`).

### Modulo Invalidità Civile
- Lista e dettaglio pratiche di invalidità (`/invalidita-civile`).
- Creazione guidata nuova pratica (`/invalidita-civile/new`).
- Certificati medici associati alle pratiche (`medical_certificates`).
- Dashboard medico dedicata (`/medico/dashboard`).

### Modulo TARI Roma/AMA
- Portale consultivo `/tari` con fonti ufficiali AMA Roma e Roma Capitale.
- Scheda operativa verticale `/tari/[id]` con documenti, task, cambio stato e fonti collegate.
- Workflow operativo per attivazione, variazione, cessazione, riduzioni, esenzioni, rimborsi e contestazioni.
- Checklist documentale e mappatura moduli AMA.
- Nuova pratica TARI da `/cases/new?type=tari`; elenco pratiche TARI da `/cases?type=tari`.

### Assistente AI
- Chat integrata (`/chat`) collegata a OpenRouter via Vercel AI SDK.
- Validazione input e rate limiting per contenere costi e abusi.
- L'assistente non fornisce diagnosi mediche.

### Ricerca globale
- Componente `GlobalSearch` (`/api/search`) per cercare contatti e pratiche in tempo reale.

### Impostazioni e profilo
- Pagina Impostazioni (`/settings`) con modulo aggiornamento profilo e preferenze utente.

### Notifiche
- Sistema toast con varianti `success`, `error`, `warning`, `info` e attributo `aria-live="polite"` per l'accessibilità.
- API notifiche (`/api/notifications`).

### Accessibilità
- Skip-link "Salta al contenuto" visibile a focus per navigazione tastiera.
- Attributo `aria-live` sui messaggi di stato dinamici.

### Skeleton di caricamento
- Schermata di loading scheletrizzata per le sezioni principali (dashboard, contatti, pratiche, task).

### Manifest PWA
- File `manifest.ts` per installazione come Progressive Web App.

---

## Prerequisiti

- Node.js >= 20
- Account Supabase con progetto configurato
- Account OpenRouter (per l'assistente AI)

---

## Setup locale

```bash
git clone https://github.com/praticheflaiano/Crm-patronato-e-caf.git
cd Crm-patronato-e-caf
npm install
cp .env.example .env.local
# Compila .env.local con i valori del tuo progetto Supabase
npm run dev
```

### Variabili d'ambiente (`.env.example`)

| Variabile | Obbligatoria | Descrizione |
|-----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sì | URL del progetto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sì | Chiave pubblicabile Supabase (solo `NEXT_PUBLIC_*`) |
| `SUPABASE_SERVICE_ROLE_KEY` | No (solo server) | Chiave service role — **mai esporre al client** |
| `OPENROUTER_API_KEY` | Sì (per AI) | Chiave API OpenRouter |
| `OPENROUTER_MODEL` | No | Modello AI (default: `minimax/minimax-m2.7`) |
| `OPENROUTER_SITE_URL` | No | URL produzione per le intestazioni OpenRouter |
| `OPENROUTER_APP_NAME` | No | Nome app inviato a OpenRouter |

---

## Comandi

```bash
npm run dev        # Avvia il server di sviluppo (http://localhost:3000)
npm run build      # Build di produzione
npm start          # Avvia il server di produzione
npm run lint       # Lint ESLint
npm run test       # Test unitari con Jest
npm run test:watch # Test unitari in modalità watch
npm run cypress:open  # Test E2E Cypress (interfaccia grafica)
npm run cypress:run   # Test E2E Cypress (headless)
```

---

## Struttura cartelle (sintesi)

```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── chat/               # Assistente AI OpenRouter
│   │   ├── notifications/      # Notifiche
│   │   ├── search/             # Ricerca globale
│   │   └── tasks/              # Task CRUD
│   ├── cases/                  # Pratiche (lista, [id], new)
│   ├── contacts/               # Contatti (lista, [id], new)
│   ├── chat/                   # Interfaccia assistente AI
│   ├── invalidita-civile/      # Modulo Invalidità Civile (lista, [id], new)
│   ├── medico/dashboard/       # Dashboard medico
│   ├── settings/               # Impostazioni e profilo
│   ├── tari/                   # Portale TARI (lista, [id])
│   ├── tasks/                  # Task (lista, [id])
│   ├── layout.tsx              # Layout autenticato globale
│   ├── loading.tsx             # Skeleton di caricamento globale
│   └── manifest.ts             # Manifest PWA
├── components/
│   ├── app-shell.tsx           # Shell autenticata con sidebar
│   ├── documents/              # Componenti upload/download documenti
│   ├── forms/                  # Form riutilizzabili
│   ├── invalidita/             # Componenti modulo Invalidità Civile
│   ├── notifications/          # Componenti notifiche
│   ├── search/                 # Ricerca globale
│   ├── tasks/                  # Componenti task
│   └── ui/                     # Componenti UI base (toast, ecc.)
└── lib/
    ├── case-workflow.ts        # Logica workflow stati pratica
    ├── tari.ts                 # Fonti, workflow e checklist TARI
    └── __tests__/              # Test unitari (Jest)
```

---

## Deploy su Vercel

1. Vai su [vercel.com](https://vercel.com) e accedi.
2. Clicca **Add New → Project** e importa il repository da GitHub.
3. In **Environment Variables** aggiungi le variabili elencate nella sezione Setup.
4. Clicca **Deploy**.

---

## Note di sicurezza

- **RLS attiva**: tutte le tabelle operative (`contacts`, `cases`, `documents`, `tasks`, `medical_certificates`) sono isolate per `organization_id`. Non disattivare RLS per risolvere problemi applicativi.
- **Storage scoped per organizzazione**: il bucket `documents` è privato. L'accesso (lettura, scrittura, eliminazione) è limitato ai membri dell'organizzazione proprietaria della pratica, derivata dal prefisso `{case_id}/` del path.
- **Service role key**: non esporre mai `SUPABASE_SERVICE_ROLE_KEY` in variabili `NEXT_PUBLIC_*` o nel codice client.
- **Chiave pubblicabile**: usare esclusivamente `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` nel client.
- **Assistente AI**: l'assistente non deve fornire diagnosi mediche. Il rate limiting è abilitato sull'endpoint `/api/chat`.

---

## Changelog

Vedere [`CHANGELOG.md`](./CHANGELOG.md) per lo storico completo delle versioni.

---

## Contatto admin

`praticheflaiano@gmail.com`
