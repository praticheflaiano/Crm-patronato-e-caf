export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Caricamento in corso">
      <span className="sr-only">Caricamento in corso</span>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-80 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="h-11 w-40 animate-pulse rounded-md bg-slate-200" />
          <div className="h-11 w-40 animate-pulse rounded-md bg-slate-200" />
        </div>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="h-5 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 h-8 w-12 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {/* TARI banner placeholder */}
      <div className="h-24 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100" />

      {/* Two-column section */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-48 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-4 sm:px-5">
                <div className="space-y-1.5">
                  <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-48 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-4 sm:px-5">
                <div className="space-y-1.5">
                  <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom three cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 h-6 w-6 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-4 w-56 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
