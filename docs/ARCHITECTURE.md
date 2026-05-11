# Architettura del Progetto - CRM CAF/Patronato

Il sistema segue un'architettura moderna orientata a serverless e edge computing:

*   **Frontend & Backend (Meta-Framework):** Next.js (App Router) in TypeScript con Tailwind CSS. Utilizzo di React Server Components (RSC) e Server Actions per un recupero dati rapido e sicuro.
*   **Database & Auth (BaaS):** Supabase (PostgreSQL). Fornisce autenticazione, gestione delle sessioni, database relazionale, Storage e Row Level Security (RLS).
*   **Storage:** Supabase Storage (Bucket Privato "documents" + URL firmati per l'accesso protetto).
*   **Intelligenza Artificiale:** OpenAI API (o provider equivalente). Generazione di embedding (salvati in PostgreSQL tramite `pgvector`) e interrogazioni contestualizzate con retrieval su base permessi.
*   **Hosting & CI/CD:** Vercel, per deploy fluidi, ambienti di preview, edge functions e auto-scaling.

## Struttura Cartelle Proposta
```text
/app               # Routing e Pagine Next.js (auth, dashboard, pratiche, ecc.)
/components        # Componenti UI (ui, layout, contatti, pratiche, ai, ecc.)
/lib               # Utility, client Supabase, helper AI/RAG, validatori (Zod)
/supabase          # Migrazioni DB, seed, policies SQL, edge functions
/types             # Definizione tipi TypeScript (Database, Domain)
```
