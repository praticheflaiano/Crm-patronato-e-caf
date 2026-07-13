# Checklist di Sicurezza del Sistema

## Auth
- [ ] Le chiavi service_role di Supabase non devono mai essere esposte al client e devono essere usate solo lato server.
- [ ] Le chiavi pubbliche di Supabase devono essere precedute da `NEXT_PUBLIC_`.
- [ ] Usare sempre l'utility `getSafeRedirect` per i parametri di redirect forniti dall'utente per prevenire vulnerabilità di Open Redirect.

## RLS (Row Level Security)
- [ ] RLS è obbligatoria su tutte le tabelle Supabase e non deve mai essere disabilitata.
- [ ] Le policy di UPDATE con clausola `WITH CHECK` devono riflettere o restringere opportunamente le condizioni della clausola `USING` per prevenire modifiche non autorizzate a campi protetti.
- [ ] Le tabelle operative sono multi-organizzazione e devono includere il campo `organization_id`. L'accesso deve essere ristretto in base al `organization_id` dell'utente.

## Storage
- [ ] Supabase Storage deve essere privato. I file sensibili devono essere accessibili solo tramite policy restrittive o URL firmati temporanei.

## API Routes e Edge Functions
- [ ] Limitare le dimensioni dei batch nelle Edge Functions che elaborano embedding (es. max 4-8 elementi) per evitare errori `HTTP 546 WORKER_RESOURCE_LIMIT`.

## AI / RAG
- [ ] L'assistente AI deve rispettare rigorosamente i permessi di accesso dell'utente.
- [ ] Dichiarare esplicitamente quando le informazioni sono mancanti per evitare allucinazioni.
- [ ] Non fornire mai diagnosi mediche.
