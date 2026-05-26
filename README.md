# CRM Patronato e CAF

Sistema CRM per la gestione pratiche di patronato, CAF e TARI Roma/AMA — costruito con Next.js 16, React 19, TypeScript, Tailwind CSS 4 e Supabase.

## Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: OpenAI GPT-4o via Vercel AI SDK
- **Deploy**: Vercel

## Moduli inclusi

- CAF
- Patronato
- Invalidità Civile
- TARI Roma/AMA

## Struttura principale

```
src/
├── app/
│   ├── api/               # API routes (tasks, invalidita, notifications, chat)
│   ├── invalidita-civile/ # Modulo invalidità civile
│   ├── tari/              # Portale e schede verticali TARI Roma/AMA
│   ├── medico/            # Dashboard medico
│   └── layout.tsx         # Layout autenticato
├── components/
│   ├── invalidita/         # Componenti modulo invalidità
│   ├── notifications/      # Sistema notifiche
│   └── tasks/              # Task e attività
└── lib/
    ├── case-workflow.ts    # Workflow pratiche
    └── tari.ts             # Fonti, workflow e checklist TARI
```

## TARI Roma/AMA

La sezione TARI è integrata nel CRM come modulo verticale protetto da login.

Contenuti principali:

- fonti ufficiali AMA Roma e Roma Capitale;
- workflow operativo per attivazione, variazione, cessazione, riduzioni, esenzioni, rimborsi e contestazioni;
- mappatura moduli AMA;
- checklist documentale;
- archivio consigliato per pratiche e allegati;
- scheda dettaglio verticale `/tari/[id]` con documenti, task, cambio stato e fonti ufficiali collegate.

Accesso rapido:

- `/tari` → area consultiva TARI;
- `/tari/[id]` → scheda operativa verticale della pratica TARI;
- `/cases/new?type=tari` → nuova pratica TARI;
- `/cases?type=tari` → elenco pratiche TARI.

Migrazione DB richiesta per produzione: `supabase/migrations/0010_tari_module.sql` aggiunge il valore `tari` all'enum `case_type`. Le migrazioni task note (`0011`, `0012`) vanno applicate se non già presenti nel database remoto.

## Setup Locale

```bash
git clone https://github.com/praticheflaiano/Crm-patronato-e-caf.git
cd Crm-patronato-e-caf
npm install
cp .env.example .env.local
# Compila .env.local con i valori del tuo progetto Supabase
npm run dev
```

## Deploy su Vercel

1. Vai su [vercel.com](https://vercel.com) e accedi
2. Clicca **Add New → Project**
3. Importa il repository **Crm-patronato-e-caf** da GitHub
4. In **Environment Variables** aggiungi:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `OPENAI_API_KEY` (opzionale, per l'assistente AI)
5. Clicca **Deploy**

## Moduli

- [x] Auth e gestione ruoli
- [x] Dashboard con conteggi in tempo reale
- [x] CRUD contatti e pratiche
- [x] Pipeline stati pratiche
- [x] Upload documenti con signed URL
- [x] Task e note su pratica
- [x] Modulo Invalidità Civile
- [x] Portale TARI Roma/AMA integrato
- [ ] Chat AI con RAG protetto
- [ ] Import CSV

## Contatto admin

`praticheflaiano@gmail.com`
