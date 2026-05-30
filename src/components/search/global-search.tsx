'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, Loader2 } from 'lucide-react'

interface ContactResult {
  id: string
  first_name: string | null
  last_name: string | null
  fiscal_code: string | null
}

interface CaseResult {
  id: string
  title: string | null
  type: string | null
  status: string | null
}

interface SearchResults {
  contacts: ContactResult[]
  cases: CaseResult[]
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced fetch — all state updates run inside the async timer callback
  // (never synchronously in the effect body) to avoid cascading renders.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      if (query.length < 2) {
        setResults(null)
        setOpen(false)
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (!res.ok) throw new Error('Search failed')
        const data: SearchResults = await res.json()
        setResults(data)
        setOpen(true)
      } catch {
        // Silent error — leave previous results or null
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  function handleClose() {
    setQuery('')
    setResults(null)
    setOpen(false)
  }

  const hasContacts = (results?.contacts?.length ?? 0) > 0
  const hasCases = (results?.cases?.length ?? 0) > 0
  const hasAny = hasContacts || hasCases
  const searched = query.length >= 2 && !loading && results !== null

  return (
    <div ref={containerRef} className="relative w-full sm:w-72">
      {/* Input */}
      <div className="relative flex items-center">
        <Search
          className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results && query.length >= 2) setOpen(true)
          }}
          placeholder="Cerca contatti o pratiche..."
          aria-label="Ricerca globale: cerca contatti o pratiche"
          className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        {loading && (
          <Loader2
            className="absolute right-3 h-4 w-4 animate-spin text-slate-400"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Risultati ricerca"
          className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          {loading && (
            <p className="px-4 py-3 text-sm text-slate-500">Ricerca...</p>
          )}

          {searched && !hasAny && (
            <p className="px-4 py-3 text-sm text-slate-500">Nessun risultato</p>
          )}

          {hasContacts && (
            <section>
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Contatti
              </p>
              <ul>
                {results!.contacts.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/contacts/${c.id}`}
                      onClick={handleClose}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50"
                    >
                      <span className="font-medium">
                        {[c.last_name, c.first_name].filter(Boolean).join(' ')}
                      </span>
                      {c.fiscal_code && (
                        <span className="text-slate-400">— {c.fiscal_code}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasCases && (
            <section className={hasContacts ? 'border-t border-slate-100' : ''}>
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pratiche
              </p>
              <ul>
                {results!.cases.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/cases/${c.id}`}
                      onClick={handleClose}
                      className="block px-4 py-2 text-sm text-slate-800 hover:bg-slate-50"
                    >
                      {c.title ?? '(senza titolo)'}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
