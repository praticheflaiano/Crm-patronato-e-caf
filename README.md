# CRM Patronato e CAF

Sistema CRM per la gestione pratiche di patronato e CAF — costruito con Next.js 16, React 19, TypeScript, Tailwind CSS 4 e Supabase.

## Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: OpenAI GPT-4o via Vercel AI SDK
- **Deploy**: Vercel

## Requisiti

- Node.js 20+
- Progetto Supabase (ref: `xjchklrrmyavizozhtpb`)
- Account Vercel

---

## Setup Locale

```bash
git clone https://github.com/praticheflaiano/Crm-patronato-e-caf.git
cd Crm-patronato-e-caf
npm install
cp .env.example .env.local
# Compila .env.local con i valori del tuo progetto Supabase
npm run dev
```

---

## Deploy su Vercel (manuale)

1. Vai su [vercel.com](https://vercel.com) e accedi
2. Clicca **Add New → Project**
3. Importa il repository **Crm-patronato-e-caf** da GitHub
4. In **Environment Variables** aggiungi:
   - `NEXT_PUBLIC_SUPABASE_URL` → dal progetto Supabase
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → dal progetto Supabase
   - `OPENAI_API_KEY` → (opzionale, per l'assistente AI)
5. Clicca **Deploy**

Il deploy parte in ~2 minuti. Al termine avrai un URL come `crm-patronato-e-caf.vercel.app`.

---

## Deploy Automatico con GitHub Actions

1. Fai il deploy manuale almeno una volta su Vercel (così ottieni gli ID del progetto)
2. In Vercel → Settings → General → **Org ID** e **Project ID** → copiali
3. In Vercel → Settings → Tokens → crea un **Access Token**
4. Nel repo GitHub → Settings → Secrets → Actions aggiungi:
   - `VERCEL_TOKEN` → il token Vercel
   - `VERCEL_ORG_ID` → l'Org ID
   - `VERCEL_PROJECT_ID` → il Project ID
   - `NEXT_PUBLIC_SUPABASE_URL` → URL Supabase
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → chiave pubblicabile
   - `OPENAI_API_KEY` → (opzionale)
5. Ogni push su `main` farà il deploy automatico

---

## Struttura

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (tasks, invalidita, notifications)
│   ├── invalidita-civile/ # Modulo invalidità civile
│   ├── medico/            # Dashboard medico
│   └── layout.tsx         # Layout autenticato
├── components/
│   ├── invalidita/         # Componenti modulo invalidità
│   ├── notifications/      # Sistema notifiche
│   └── tasks/             # Task e attività
└── lib/
    ├── case-workflow.ts   # Workflow pratiche
    └── utils.ts           # Utility
```

## Moduli

- [x] Auth e gestione ruoli (admin, operatore, collaboratore, medico)
- [x] Dashboard con conteggi in tempo reale
- [x] CRUD contatti e pratiche
- [x] Pipeline stati pratiche (bozza, in lavorazione, completata, etc.)
- [x] Upload documenti con signed URL
- [x] Task e note su pratica
- [x] Modulo Invalidità Civile
- [ ] Chat AI con RAG protetto
- [ ] Import CSV

---

## Contatto admin

`praticheflaiano@gmail.com`
