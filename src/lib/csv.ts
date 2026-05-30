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
