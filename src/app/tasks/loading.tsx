export default function TasksLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Caricamento in corso">
      <span className="sr-only">Caricamento in corso</span>

      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-11 w-36 animate-pulse rounded-md bg-slate-200" />
      </div>

      {/* Tasks list card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="divide-y divide-slate-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-4 sm:px-5">
              {/* Checkbox placeholder */}
              <div className="mt-0.5 h-5 w-5 shrink-0 animate-pulse rounded bg-slate-200" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="shrink-0">
                <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
