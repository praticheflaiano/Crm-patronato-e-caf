# CRM Patronato e CAF

Applicazione Next.js per Centro Pratiche Flaiano, pensata per gestire contatti, pratiche CAF/Patronato, documenti, task e assistente AI con base dati Supabase.

## Avvio locale

1. Installa le dipendenze:

```bash
npm install
```

2. Crea `.env.local` partendo da `.env.example` e inserisci le credenziali Supabase.

3. Avvia il progetto:

```bash
npm run dev
```

4. Apri `http://localhost:3000`.

Se `.env.local` non è configurato, l'app mostra una schermata di configurazione invece di andare in errore.

## Database

Le migrazioni iniziali sono in `supabase/migrations`:

- `0001_initial_schema.sql`: schema contatti, pratiche, documenti, task e certificati medici.
- `0002_rls_policies.sql`: policy RLS di base per utenti autenticati.

## Documentazione

Il piano architetturale e operativo è in `docs/`.
