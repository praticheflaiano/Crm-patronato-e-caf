'use client'

import { useId, useState } from 'react'
import { HelpCircle } from 'lucide-react'

type HelpTipProps = {
  /** Testo di aiuto mostrato nel riquadro. */
  text: string
  /** Etichetta accessibile del pulsante (default generico). */
  label?: string
  /** Allineamento del riquadro rispetto al pulsante. */
  align?: 'left' | 'right'
}

/**
 * Piccolo "?" con spiegazione contestuale, pensato per utenti poco esperti.
 * Si apre al passaggio del mouse, al focus da tastiera e al click/tap (mobile).
 * Completamente accessibile: il riquadro è collegato al pulsante via aria-describedby.
 */
export function HelpTip({ text, label = 'Mostra aiuto', align = 'left' }: HelpTipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-primary"
      >
        <HelpCircle size={15} aria-hidden="true" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`animate-fade-in absolute bottom-full z-50 mb-2 w-64 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium leading-relaxed text-white shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {text}
        </span>
      )}
    </span>
  )
}
