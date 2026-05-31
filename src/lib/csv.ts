/**
 * Converts an array of records to a CSV string.
 * - First row contains column labels.
 * - Fields containing `"`, `,`, `;`, newline or `\r` are wrapped in double quotes
 *   with internal double quotes doubled.
 * - null/undefined values are rendered as empty strings.
 * - Rows are separated by CRLF (\r\n).
 * - Prepends the UTF-8 BOM for Excel compatibility.
 */
export function toCsv(
  rows: Record<string, unknown>[],
  columns: { key: string; label: string }[],
): string {
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (/[",;\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const header = columns.map(col => escape(col.label)).join(',')
  const dataRows = rows.map(row =>
    columns.map(col => escape(row[col.key])).join(','),
  )

  const bom = '﻿'
  return bom + [header, ...dataRows].join('\r\n') + '\r\n'
}

/**
 * Parses a CSV string into an array of row objects keyed by header name.
 * - Handles quoted fields, escaped quotes ("") and both , and ; separators
 *   (auto-detected from the header line).
 * - Strips a leading UTF-8 BOM. Header names are trimmed and lower-cased.
 * - Tolerates CRLF and LF line endings.
 */
export function parseCsv(input: string): Record<string, string>[] {
  const text = input.replace(/^﻿/, '')
  if (!text.trim()) return []

  // Tokenise the whole file respecting quotes, tracking field/row boundaries.
  const firstLine = text.slice(0, text.search(/\r?\n/) === -1 ? text.length : text.search(/\r?\n/))
  const delimiter = firstLine.split(';').length > firstLine.split(',').length ? ';' : ','

  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') { inQuotes = true; continue }
    if (ch === delimiter) { row.push(field); field = ''; continue }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue }
    if (ch === '\r') continue
    field += ch
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }

  if (rows.length < 2) return []
  const headers = rows[0].map(h => h.trim().toLowerCase())

  return rows.slice(1)
    .filter(cols => cols.some(c => c.trim() !== ''))
    .map(cols => {
      const record: Record<string, string> = {}
      headers.forEach((h, idx) => { record[h] = (cols[idx] ?? '').trim() })
      return record
    })
}
