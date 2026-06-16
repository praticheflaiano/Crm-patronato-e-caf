# Checklist di Sicurezza - CRM Patronato e CAF

Questa checklist riassume i controlli di sicurezza chiave applicati e da mantenere costantemente nel progetto, coprendo Autenticazione, RLS (Row Level Security), Storage, API e Edge Functions.

## 1. Autenticazione (Supabase Auth)
- [ ] **MFA (Multi-Factor Authentication):** Suggerito per account Admin.
- [x] **Gestione Sessione:** Disconnessione su inattività, token JWT protetti.
- [x] **Service Role Key:** Mai esposta nel frontend. Solo il server la utilizza per operazioni di emergenza o amministrative fuori contesto RLS.
- [x] **Ruoli Utente:** Assegnazione controllata (`admin`, `operator`, `collaborator`, `doctor`). Default per nuove registrazioni impostato su "pending" e senza organizzazione.
- [x] **Approvazione Registrazioni:** Un admin deve approvare (`approve_member`) i nuovi account per evitare accessi abusivi.

## 2. Row Level Security (RLS) su PostgreSQL
- [x] **Abilitazione Globale:** RLS è attiva di default su TUTTE le tabelle applicative (`contacts`, `cases`, `documents`, `tasks`, `profiles`, ecc.). NON viene mai disabilitata.
- [x] **Isolamento Organizzazioni (`organization_id`):** Tutte le policy di base filtrano su `organization_id = current_user_org_id()`. Un utente non può mai leggere o scrivere dati di un'altra organizzazione.
- [x] **Isolamento Ruoli:**
  - `admin`: Accesso CRUD totale sulla propria org.
  - `operator`: Accesso CRUD quasi totale, ma senza gestione configurazioni critiche.
  - `collaborator`: Visibilità limitata alle pratiche dove è assegnato.
  - `doctor`: Visibilità strettamente limitata alle pratiche mediche assegnate.
- [x] **Prevenzione Escalation Profili:** Gli utenti possono aggiornare solo campi innocui (es. `full_name`). I campi sensibili (`role`, `organization_id`, `status`) sono protetti e gestiti solo da funzioni Security Definer amministrative.
- [x] **WITH CHECK:** Le policy UPDATE/INSERT hanno clausole `WITH CHECK` per impedire il cambio di `organization_id` in modo fraudolento.

## 3. Storage (Documenti e File)
- [x] **Bucket Privato:** Il bucket `documents` è configurato come privato.
- [x] **Accesso Firmato (Signed URLs):** I documenti vengono scaricati dal frontend solo tramite URL generati a tempo (`createSignedUrl`).
- [x] **RLS su Storage:** Le policy su `storage.objects` impediscono a utenti generici di leggere file. Solo i membri dell'organizzazione (derivata dal path `{case_id}/`) possono accedervi, nel rispetto del loro ruolo (es. medici solo per pratiche loro).

## 4. API Routes e Server Actions (Next.js)
- [x] **Controllo Autenticazione:** Ogni endpoint in `/api/*` e ogni Server Action controlla `supabase.auth.getUser()`.
- [x] **Validazione Input (Zod):** Tutti i payload e i query params sono validati tipologicamente per prevenire injection e dati malformati.
- [x] **Rate Limiting:** Rotte esposte ad abusi (come `/api/chat`) includono limitazioni di rate.
- [x] **Controllo Autorizzazioni (RBAC):** Le azioni amministrative (es. salvataggio chiavi API) controllano esplicitamente se l'utente è un admin prima di procedere.

## 5. Edge Functions (Supabase)
- [x] **Protezione JWT:** La chiamata alla funzione richiede un header di autorizzazione (Bearer token).
- [x] **Resource Limits:** Le funzioni pesanti (come l'embedding `gte-small`) controllano il numero di input per prevenire errori 546 `WORKER_RESOURCE_LIMIT` e conseguenti instabilità del servizio. Cap difensivi sono implementati.
- [x] **Nessuna Chiave Segreta nel Client:** Eventuali API key esterne (es. OpenRouter) sono lette dal database (`app_settings`) via service role direttamente sul server.

## 6. Sicurezza Dati e AI (RAG)
- [x] **Segregazione Vettori:** La funzione di ricerca di similarità (`match_knowledge_chunks`) forza il controllo sul `current_user_org_id()` prima di effettuare qualsiasi ricerca `pgvector`.
- [x] **Limitazione AI:** L'assistente AI ha restrizioni rigide a livello di prompt per non fornire mai diagnosi mediche e per attenersi rigorosamente ai dati forniti nel contesto RAG/Pratiche.
- [x] **Contesto Limitato RLS:** Le pratiche fornite all'assistente AI come contesto vengono lette utilizzando il client autenticato dell'utente, assicurando che l'AI non possa divulgare pratiche invisibili all'utente.
