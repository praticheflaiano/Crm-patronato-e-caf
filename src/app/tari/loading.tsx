export default function TariLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Caricamento in corso">
      <span className="sr-only">Caricamento in corso</span>

      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-72 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="flex gap-2">
          <div className="h-11 w-36 animate-pulse rounded-md bg-slate-200" />
          <div className="h-11 w-44 animate-pulse rounded-md bg-slate-200" />
        </div>
      </div>

      {/* Info banner placeholder */}
      <div className="h-20 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100" />

      {/* Cases list card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="divide-y divide-slate-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-52 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-36 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
                <div className="hidden h-4 w-16 animate-pulse rounded bg-slate-200 sm:block" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
