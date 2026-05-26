export type TariPracticeKind =
  | 'attivazione'
  | 'variazione'
  | 'cessazione'
  | 'riduzione'
  | 'esenzione'
  | 'pagamento'
  | 'rateizzazione'
  | 'rimborso'
  | 'contestazione'
  | 'ravvedimento'

export const TARI_OFFICIAL_SOURCES = [
  {
    title: 'AMA Roma — TARI',
    href: 'https://www.amaroma.it/it/tari',
    note: 'Portale madre con accesso a modulistica, pagamenti, normativa, agevolazioni e aggiornamenti.',
  },
  {
    title: 'AMA Roma — Modulistica TARI',
    href: 'https://www.amaroma.it/it/tari/modulistica',
    note: 'Area da cui scaricare i moduli ufficiali per le pratiche TARI.',
  },
  {
    title: 'AMA Roma — Attivazione / variazione / cessazione',
    href: 'https://www.amaroma.it/it/tari/attivazione-variazione-cessazione',
    note: 'Fonte primaria per l’invio delle dichiarazioni sulla posizione TARI.',
  },
  {
    title: 'AMA Roma — Agevolazioni e riduzioni',
    href: 'https://www.amaroma.it/it/tari/agevolazioni-e-riduzioni',
    note: 'Sezione da verificare sempre prima di impostare riduzioni o esenzioni.',
  },
  {
    title: 'AMA Roma — Esenzioni',
    href: 'https://www.amaroma.it/it/tari/esenzioni',
    note: 'Pagina di riferimento per i casi di esclusione dal tributo o agevolazioni specifiche.',
  },
  {
    title: 'AMA Roma — Rateizzazioni',
    href: 'https://www.amaroma.it/it/tari/rateizzazioni',
    note: 'Informazioni ufficiali per piani di rientro e dilazioni di pagamento.',
  },
  {
    title: 'AMA Roma — Ravvedimento operoso',
    href: 'https://www.amaroma.it/it/tari/ravvedimento-operoso',
    note: 'Riferimento per tardivi adempimenti e regolarizzazioni spontanee.',
  },
  {
    title: 'AMA Roma — Pagamenti',
    href: 'https://www.amaroma.it/it/tari/pagamenti',
    note: 'Fonte da consultare per modalità di pagamento, istruzioni e riferimenti correnti.',
  },
  {
    title: 'AMA Roma — Normativa',
    href: 'https://www.amaroma.it/it/tari/normativa',
    note: 'Sezione normativa ufficiale da ricontrollare prima dell’invio di pratiche sensibili.',
  },
  {
    title: 'Roma Capitale — Scheda servizio TARI',
    href: 'https://www.comune.roma.it/web/it/scheda-servizi.page?contentId=INF656833',
    note: 'Portale istituzionale di Roma Capitale con collegamenti ad atti, regolamento e delibere.',
  },
] as const

export const TARI_WORKFLOW_STEPS = [
  {
    title: '1. Classificazione iniziale',
    summary: 'Stabilisci subito che cosa sta chiedendo il cittadino e a quale immobile si riferisce la pratica.',
    bullets: [
      'attivazione utenza domestica;',
      'variazione anagrafica o dell’immobile;',
      'cessazione dell’occupazione;',
      'riduzione, esenzione o agevolazione;',
      'pagamento, rimborso, rateizzazione o contestazione.',
    ],
  },
  {
    title: '2. Raccolta dati minimi',
    summary: 'Non aprire la pratica senza i dati essenziali per identificare contribuente e immobile.',
    bullets: [
      'nome, cognome, codice fiscale e recapiti;',
      'indirizzo completo dell’immobile e interni/scala quando presenti;',
      'titolo di occupazione o detenzione dell’immobile;',
      'data di inizio/fine occupazione o decorrenza della variazione;',
      'superficie, dati catastali e codice utenza se già disponibili.',
    ],
  },
  {
    title: '3. Verifica documentale',
    summary: 'Prima di inviare il modulo, verifica che ogni allegato richiesto sia presente e leggibile.',
    bullets: [
      'documento d’identità e codice fiscale;',
      'contratto di locazione, comodato, atto di acquisto o documento equivalente;',
      'eventuale verbale di consegna/riconsegna chiavi;',
      'visura catastale o dati catastali;',
      'avviso, bolletta o F24 quando la pratica riguarda pagamento o contestazione.',
    ],
  },
  {
    title: '4. Controllo qualità finale',
    summary: 'Confronta i dati tra documenti, modulo e fonte ufficiale prima dell’invio o dell’archiviazione.',
    bullets: [
      'coerenza tra indirizzo, titolarità e date;',
      'modulo AMA corretto per il tipo di pratica;',
      'fonti ufficiali citate in scheda pratica;',
      'protocolli e ricevute conservati in cartella;',
      'scadenze e decorrenze annotate in modo chiaro.',
    ],
  },
] as const

export const TARI_DOCUMENT_CHECKLISTS = [
  {
    title: 'Attivazione / variazione / cessazione',
    bullets: [
      'documento di identità e codice fiscale;',
      'delega/intermediario se la pratica non è presentata dall’interessato;',
      'contratto o titolo che giustifica la detenzione dell’immobile;',
      'dati catastali o visura se disponibili;',
      'prova della data di decorrenza quando rilevante.',
    ],
  },
  {
    title: 'Riduzioni / esenzioni',
    bullets: [
      'documentazione prevista dalla misura specifica;',
      'prova del requisito dichiarato;',
      'ISEE solo se richiesto dalla fonte ufficiale;',
      'documenti che provano uso/non uso dell’immobile quando pertinenti;',
      'verifica preliminare delle condizioni presenti in AMA/Roma Capitale.',
    ],
  },
  {
    title: 'Contestazioni / rateizzazioni / rimborsi',
    bullets: [
      'avviso, sollecito o accertamento integrale;',
      'ricevute di pagamento o F24;',
      'precedenti dichiarazioni TARI e protocolli;',
      'documenti che provano date di occupazione o cessazione;',
      'eventuali PEC e riscontri ricevuti dall’ente.',
    ],
  },
] as const

export const TARI_MODULE_MAP = [
  {
    code: 'MOD600',
    title: 'Comunicazione di attivazione / cessazione / variazione',
    useCase: 'Utenze domestiche: ingresso, cambio dati, uscita dall’immobile.',
    note: 'È il modulo cardine da controllare quando la pratica riguarda l’occupazione dell’immobile.',
  },
  {
    code: 'MOD603',
    title: 'Richiesta di riduzione tariffaria',
    useCase: 'Riduzioni tariffarie e agevolazioni collegate ai requisiti previsti.',
    note: 'Verificare sempre che il requisito sia ancora previsto dalle fonti ufficiali aggiornate.',
  },
  {
    code: 'MOD605',
    title: 'Agevolazione ambientale / autocompostaggio',
    useCase: 'Dichiarazioni per autocompostaggio o misure ambientali specifiche.',
    note: 'Richiede controllo puntuale delle condizioni applicabili al contribuente.',
  },
  {
    code: 'MOD608',
    title: 'Istanza di autotutela',
    useCase: 'Contestazione o rettifica di avvisi e posizioni non corretti.',
    note: 'Da usare con cronologia eventi, motivazioni e allegati di supporto ben ordinati.',
  },
  {
    code: 'MOD610',
    title: 'Rimborso o compensazione',
    useCase: 'Rientro di importi versati in eccesso o compensazione dovuta.',
    note: 'Serve sempre una verifica dei pagamenti e del periodo di riferimento.',
  },
  {
    code: 'MOD611',
    title: 'Richiesta di rateizzazione',
    useCase: 'Piano di rientro su importi TARI dovuti.',
    note: 'Controllare condizioni, importi e scadenze della rateizzazione prima dell’invio.',
  },
  {
    code: 'MOD612',
    title: 'Comunicazione dati catastali',
    useCase: 'Integrazione o correzione dei dati catastali collegati alla posizione.',
    note: 'Fondamentale quando la posizione contiene dati tecnici mancanti o errati.',
  },
  {
    code: 'MOD613',
    title: 'Annullamento cartella esattoriale in autotutela',
    useCase: 'Contestazione di cartelle o ruoli già iscritti.',
    note: 'Da gestire solo con atto completo e prova documentale adeguata.',
  },
  {
    code: 'MOD621',
    title: 'Comunicazione di ravvedimento operoso',
    useCase: 'Regolarizzazione spontanea di tardivi versamenti o dichiarazioni.',
    note: 'Verificare sempre il calcolo e la documentazione di pagamento.',
  },
] as const

export const TARI_ARCHIVING_TEMPLATE = [
  'clienti/<nome-cognome>/<YYYY-MM-DD_tipo-pratica>/',
  '  scheda_pratica.yaml',
  '  documenti/input/       originali caricati',
  '  documenti/estratti/    testo o OCR generato',
  '  documenti/output_pdf/  moduli compilati o bozze',
  '  note/                  appunti operatore',
  '  rag/                   indice pratica',
] as const

export function getTariPracticeLabel(kind: TariPracticeKind | string | null | undefined) {
  const labels: Record<TariPracticeKind, string> = {
    attivazione: 'Attivazione',
    variazione: 'Variazione',
    cessazione: 'Cessazione',
    riduzione: 'Riduzione',
    esenzione: 'Esenzione',
    pagamento: 'Pagamento',
    rateizzazione: 'Rateizzazione',
    rimborso: 'Rimborso / compensazione',
    contestazione: 'Contestazione / autotutela',
    ravvedimento: 'Ravvedimento operoso',
  }

  return kind && kind in labels ? labels[kind as TariPracticeKind] : 'Pratica TARI'
}
