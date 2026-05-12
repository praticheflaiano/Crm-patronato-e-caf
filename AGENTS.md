<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from older versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js-specific code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CRM Patronato e CAF - Memoria operativa

Prima di modificare il progetto, leggere `docs/PROGRESSO.md`.

Regole specifiche del progetto:

- Non esporre mai `SUPABASE_SERVICE_ROLE_KEY` nel client.
- Usare la chiave Supabase pubblicabile solo in variabili `NEXT_PUBLIC_*`.
- Non disattivare RLS per risolvere problemi applicativi.
- Le tabelle operative sono multi-organizzazione tramite `organization_id`.
- L'utente operativo principale e admin e `praticheflaiano@gmail.com`.
- Il progetto Supabase e `xjchklrrmyavizozhtpb`.
- Prima di lavorare su documenti, storage o dati sanitari, verificare RLS e permessi.
- L'assistente AI non deve mai fornire diagnosi mediche.
- Dopo modifiche: eseguire `npm run lint` e `npm run build`.

Sequenza concordata:

1. Profili, organizzazione e ruoli. Completato.
2. CRUD contatti e pratiche. Base completata.
3. Pipeline pratiche e stati strutturati.
4. Documenti privati con upload/download firmato.
5. Task e note.
6. RLS avanzata per ruoli.
7. Modulo Invalidita Civile.
8. Knowledge base e AI/RAG protetto.
