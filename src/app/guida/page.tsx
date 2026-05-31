import Link from 'next/link'
import {
  BarChart3,
  CalendarDays,
  FileText,
  FolderKanban,
  LifeBuoy,
  MessageSquare,
  Stethoscope,
  Upload,
  Users,
} from 'lucide-react'

export const metadata = {
  title: 'Guida - Centro Flaiano',
  description: 'Guida rapida all’uso del gestionale',
}

type Step = { title: string; body: string }

const sections: {
  icon: typeof Users
  title: string
  intro: string
  steps: Step[]
  cta?: { href: string; label: string }
}[] = [
  {
    icon: Users,
    title: 'Gestire i contatti (i tuoi clienti)',
    intro: 'I contatti sono l’anagrafica delle persone che assisti. Ogni pratica va collegata a un contatto.',
    steps: [
      { title: 'Creare un contatto', body: 'Vai su Contatti e premi “Nuovo contatto”. Servono almeno Nome, Cognome e Codice Fiscale.' },
      { title: 'Importare un elenco', body: 'Hai già un file Excel/CSV? Usa “Importa CSV”: i clienti già presenti (stesso Codice Fiscale) vengono saltati in automatico.' },
      { title: 'Esportare', body: 'Con “Esporta CSV” scarichi tutta l’anagrafica, ad esempio per un backup.' },
    ],
    cta: { href: '/contacts', label: 'Vai ai Contatti' },
  },
  {
    icon: FolderKanban,
    title: 'Aprire e seguire una pratica',
    intro: 'La pratica è il lavoro che svolgi per un cliente (CAF, Patronato, Invalidità, TARI).',
    steps: [
      { title: 'Creare la pratica', body: 'Da Pratiche premi “Nuova”, scegli il cliente (o creane uno al volo) e il tipo di servizio.' },
      { title: 'Far avanzare lo stato', body: 'Ogni pratica ha uno stato: Aperta → In lavorazione → (Documenti mancanti) → Completata o Respinta. Usa i pulsanti nella scheda per cambiarlo.' },
      { title: 'Documenti mancanti', body: 'Mettendo una pratica in “Documenti mancanti” segnali che stai aspettando qualcosa dal cittadino; viene creato un promemoria.' },
    ],
    cta: { href: '/cases', label: 'Vai alle Pratiche' },
  },
  {
    icon: CalendarDays,
    title: 'Scadenze e promemoria',
    intro: 'Tieni sotto controllo gli appuntamenti e le cose da fare.',
    steps: [
      { title: 'Aggiungere una scadenza', body: 'Da Scadenze crei un promemoria con una data. Puoi collegarlo a una pratica oppure lasciarlo generale.' },
      { title: 'Segnare come fatto', body: 'Quando completi un’attività, spuntala: sparirà dalle scadenze attive.' },
    ],
    cta: { href: '/tasks', label: 'Vai alle Scadenze' },
  },
  {
    icon: Stethoscope,
    title: 'Invalidità Civile',
    intro: 'Sezione dedicata alle domande di invalidità, con certificati medici e iter INPS.',
    steps: [
      { title: 'Avviare la pratica', body: 'Crea una pratica di tipo Invalidità Civile: avrai una scheda dedicata con percentuale, prestazioni richieste e stato dell’iter.' },
      { title: 'Collaborare con il medico', body: 'Puoi invitare un medico a collaborare sulla singola pratica per i certificati. I dati sanitari sono protetti e visibili solo a chi è autorizzato.' },
    ],
    cta: { href: '/invalidita-civile', label: 'Vai a Invalidità Civile' },
  },
  {
    icon: BarChart3,
    title: 'Report e statistiche',
    intro: 'Una panoramica dell’attività: quante pratiche, in che stato, quante scadenze in ritardo.',
    steps: [
      { title: 'Leggere i numeri', body: 'In Report trovi i totali e i grafici per stato e per servizio. Utile per capire il carico di lavoro.' },
    ],
    cta: { href: '/report', label: 'Vai ai Report' },
  },
  {
    icon: MessageSquare,
    title: 'Assistente AI',
    intro: 'Un aiuto per domande generali sulle procedure.',
    steps: [
      { title: 'Come usarlo', body: 'Scrivi la tua domanda in linguaggio naturale. Nota: l’assistente fornisce informazioni di carattere generale e non sostituisce un parere professionale; non dà diagnosi mediche.' },
    ],
    cta: { href: '/chat', label: 'Apri l’Assistente' },
  },
]

export default function GuidaPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-hover p-6 text-white shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <LifeBuoy size={22} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Guida rapida</h1>
            <p className="mt-1 text-sm text-white/85">Tutto quello che serve per iniziare, spiegato in modo semplice.</p>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm text-white/90">
          Non serve essere esperti di computer. Segui i passaggi qui sotto: ogni sezione ti porta direttamente
          alla parte del programma giusta. Trovi questo simbolo <span className="font-semibold">?</span> accanto ai
          campi più importanti per una spiegazione veloce.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { href: '/contacts/new', label: 'Nuovo contatto', icon: Users },
          { href: '/cases/new', label: 'Nuova pratica', icon: FolderKanban },
          { href: '/contacts/import', label: 'Importa CSV', icon: Upload },
          { href: '/tasks', label: 'Scadenze', icon: CalendarDays },
          { href: '/report', label: 'Report', icon: BarChart3 },
          { href: '/tari', label: 'TARI', icon: FileText },
        ].map((a) => {
          const Icon = a.icon
          return (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary/40 hover:text-primary"
            >
              <Icon size={18} aria-hidden="true" />
              {a.label}
            </Link>
          )
        })}
      </div>

      {/* Sections */}
      <div className="space-y-5">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-slate-950">{section.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{section.intro}</p>
                </div>
              </div>

              <ol className="mt-4 space-y-3">
                {section.steps.map((step, i) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                      <p className="text-sm text-slate-600">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {section.cta && (
                <div className="mt-5">
                  <Link
                    href={section.cta.href}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
                  >
                    {section.cta.label}
                  </Link>
                </div>
              )}
            </section>
          )
        })}
      </div>

      <p className="pb-2 text-center text-xs text-slate-400">
        Hai bisogno di aiuto in un punto preciso? Cerca il simbolo «?» accanto ai campi.
      </p>
    </div>
  )
}
