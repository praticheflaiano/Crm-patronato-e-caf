import { formatDistanceToNow as dateFnsFormatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

export function formatDistanceToNow(date: string): string {
  return dateFnsFormatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: it,
  })
}