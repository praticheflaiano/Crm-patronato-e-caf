export default function InvaliditaCivileLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Caricamento in corso">
      <span className="sr-only">Caricamento in corso</span>

      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="h-5 w-28 animate-pulse rounded bg-slate-200" />
          <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-80 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="flex gap-2">
          <div className="h-11 w-40 animate-pulse rounded-md bg-slate-200" />
        </div>
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-5 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-3 h-7 w-10 animate-pulse rounded bg-slate-200" />
            <div className="mt-1 h-3 w-28 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Cases list card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="divide-y divide-slate-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-52 animate-pulse rounded bg-slate-200" />
                <div className="flex gap-2">
                  <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
                <div className="hidden h-4 w-24 animate-pulse rounded bg-slate-200 sm:block" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
