# Checklist di Sicurezza del Sistema

Questa checklist copre i controlli essenziali di sicurezza per l'applicazione, assicurando che le policy e le pratiche di sicurezza siano correttamente implementate.

## Auth & Sessioni
- [ ] Il login utilizza Supabase Auth in modo sicuro.
- [ ] Le sessioni sono gestite server-side (SSR) dove appropriato.
- [ ] Nessun token `service_role` è esposto lato client.
- [ ] Le chiavi pubbliche (es. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) sono usate per le connessioni client.

## Row Level Security (RLS)
- [ ] RLS è abilitata in modo forzato su TUTTE le tabelle. Non disabilitare mai RLS per aggirare problemi.
- [ ] Le policy `UPDATE` e `INSERT` utilizzano la clausola `WITH CHECK` per riflettere i filtri di sicurezza e prevenire modifiche non autorizzate (es. `organization_id`).
- [ ] L'accesso ai record è vincolato a `organization_id` per garantire il multitenant.
- [ ] I collaboratori accedono solo alle pratiche a loro assegnate.
- [ ] I medici accedono solo alle pratiche mediche assegnate a loro.

## Storage
- [ ] I bucket Supabase (come `documents`) sono privati, e non accessibili pubblicamente.
- [ ] L'accesso ai documenti avviene tramite policy ristrette e/o Signed URL generati dinamicamente.
- [ ] Lo storage è "scoped" per organizzazione (i membri vedono solo i documenti legati alle proprie pratiche).

## API Routes & Endpoint
- [ ] Gli endpoint in `/api/` (inclusi quelli esportati) verificano sempre l'autenticazione tramite il server-side client di Supabase.
- [ ] Viene eseguita la validazione dell'input lato server (es. sanitizzazione parametri, validazione limitazioni di rate).
- [ ] Open Redirect Prevention: tutti i redirect basati sull'input dell'utente usano l'utility `getSafeRedirect()` per verificare l'origine della richiesta.

## Database & Migrazioni
- [ ] Le chiavi esterne per le relazioni tra profili si basano su `public.profiles(id)` e non `auth.users(id)` per agevolare il PostgREST joining.
- [ ] Le migrazioni SQL sono versionate correttamente in `supabase/migrations/`.
- [ ] Functions e Trigger critici hanno un `search_path` specificato e usano i permessi corretti (es. `SECURITY DEFINER` solo dove assolutamente necessario).

## Edge Functions & AI RAG
- [ ] Limitazioni rigorose delle batch size (max 4-8 elementi) nelle Edge Functions che gestiscono embeddings per evitare `HTTP 546 WORKER_RESOURCE_LIMIT`.
- [ ] Il RAG sui documenti rispetta i permessi d'accesso, evitando divulgazione non autorizzata.
- [ ] Il sistema AI non esegue diagnosi e chiarisce i limiti dei propri consigli (non diagnostici).
