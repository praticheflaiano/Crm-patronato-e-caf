'use client'

import { useState } from 'react'
import { UserPlus, Users } from 'lucide-react'

type Contact = {
  id: string
  first_name: string
  last_name: string
  fiscal_code: string
}

const fieldClass =
  'block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:text-sm'
const labelClass = 'mb-1 block text-sm font-medium text-slate-700'

export function CaseContactPicker({
  contacts,
  defaultContactId = '',
}: {
  contacts: Contact[]
  defaultContactId?: string
}) {
  const hasContacts = contacts.length > 0
  const [mode, setMode] = useState<'existing' | 'new'>(hasContacts ? 'existing' : 'new')

  const tabBase =
    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors'

  return (
    <div>
      <input type="hidden" name="contact_mode" value={mode} />

      <div className="mb-3 flex items-center gap-2">
        <span className={labelClass + ' mb-0'}>Contatto associato *</span>
      </div>

      <div className="mb-3 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setMode('existing')}
          disabled={!hasContacts}
          className={`${tabBase} ${mode === 'existing' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Users size={15} aria-hidden="true" />
          Esistente
        </button>
        <button
          type="button"
          onClick={() => setMode('new')}
          className={`${tabBase} ${mode === 'new' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <UserPlus size={15} aria-hidden="true" />
          Nuovo contatto
        </button>
      </div>

      {mode === 'existing' ? (
        <select name="contact_id" required defaultValue={defaultContactId} className={fieldClass}>
          <option value="">Seleziona un contatto...</option>
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.last_name} {contact.first_name} ({contact.fiscal_code})
            </option>
          ))}
        </select>
      ) : (
        <div className="space-y-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-4">
          <p className="text-xs text-slate-500">
            Il nuovo contatto verrà creato e collegato automaticamente alla pratica.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="new_first_name" className={labelClass}>Nome *</label>
              <input id="new_first_name" name="new_first_name" type="text" required placeholder="es. Mario" className={fieldClass} />
            </div>
            <div>
              <label htmlFor="new_last_name" className={labelClass}>Cognome *</label>
              <input id="new_last_name" name="new_last_name" type="text" required placeholder="es. Rossi" className={fieldClass} />
            </div>
          </div>
          <div>
            <label htmlFor="new_fiscal_code" className={labelClass}>Codice fiscale *</label>
            <input
              id="new_fiscal_code"
              name="new_fiscal_code"
              type="text"
              required
              maxLength={16}
              placeholder="RSSMRA80A01H501U"
              className={`${fieldClass} uppercase`}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="new_phone" className={labelClass}>Telefono</label>
              <input id="new_phone" name="new_phone" type="tel" placeholder="Opzionale" className={fieldClass} />
            </div>
            <div>
              <label htmlFor="new_email" className={labelClass}>Email</label>
              <input id="new_email" name="new_email" type="email" placeholder="Opzionale" className={fieldClass} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
