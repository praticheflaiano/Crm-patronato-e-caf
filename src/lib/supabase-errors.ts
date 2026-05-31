type SupabaseLikeError = {
  code?: string
  message?: string
  details?: string | null
  hint?: string | null
}

export function isMissingSchemaResourceError(error: unknown) {
  const err = error as SupabaseLikeError | null
  if (!err) return false

  const message = err.message?.toLowerCase() ?? ''
  return (
    err.code === 'PGRST205' ||
    message.includes('could not find the table') ||
    message.includes('could not find a relationship') ||
    message.includes('schema cache')
  )
}

export function getSafeErrorMessage(error: unknown, fallback = 'Si è verificato un errore. Riprova.') {
  // Log the real error server-side for diagnostics, but never leak DB internals
  // (table/column/constraint names) to the client.
  if (error) {
    const err = error as SupabaseLikeError | Error
    const detail = 'message' in err && err.message ? err.message : String(error)
    console.error('Supabase error:', detail)
  }
  return fallback
}
