# Checklist Sicurezza Avanzata

## Auth
- [ ] Le password sono protette.
- [ ] Le sessioni hanno scadenza corretta.

## RLS
- [ ] Tutte le tabelle hanno RLS attivo.
- [ ] Policy per organizzazione su tutte le tabelle.

## Storage
- [ ] Bucket privati per documenti.
- [ ] Signed URL per l'accesso.

## API Routes
- [ ] Validazione input (Zod).
- [ ] Autenticazione richiesta per ogni endpoint.

## Edge Functions
- [ ] JWT di Supabase verificato in ogni funzione.
