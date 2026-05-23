export function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export function isPastDate(value: string | null | undefined) {
  if (!value) return false
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date < startOfToday()
}

export function isTodayDate(value: string | null | undefined) {
  if (!value) return false
  const date = new Date(value)
  const today = startOfToday()
  date.setHours(0, 0, 0, 0)
  return date.getTime() === today.getTime()
}

export function isWithinNextDays(value: string | null | undefined, days: number) {
  if (!value) return false
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  const today = startOfToday()
  const end = addDays(today, days)
  return date >= today && date <= end
}

export function formatDateIt(value: string | null | undefined) {
  if (!value) return 'Senza scadenza'
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
