export default function ContactsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Caricamento in corso">
      <span className="sr-only">Caricamento in corso</span>

      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="h-8 w-36 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="h-11 w-36 animate-pulse rounded-md bg-slate-200" />
          <div className="h-11 w-40 animate-pulse rounded-md bg-slate-200" />
        </div>
      </div>

      {/* Search + table card */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        {/* Search bar */}
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="h-10 w-full animate-pulse rounded-md bg-slate-200" />
        </div>

        {/* Table header */}
        <div className="hidden bg-slate-50 md:grid md:grid-cols-6 md:gap-4 md:px-5 md:py-3">
          {['Nome', 'Codice Fiscale', 'Email', 'Telefono', 'Pratiche', 'Azioni'].map((col) => (
            <div key={col} className="h-3 w-16 animate-pulse rounded bg-slate-200" />
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 sm:px-5 md:grid md:grid-cols-6">
              <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div className="hidden h-4 w-40 animate-pulse rounded bg-slate-200 md:block" />
              <div className="hidden h-4 w-24 animate-pulse rounded bg-slate-200 md:block" />
              <div className="hidden h-4 w-8 animate-pulse rounded bg-slate-200 md:block" />
              <div className="hidden h-4 w-16 animate-pulse rounded bg-slate-200 md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
