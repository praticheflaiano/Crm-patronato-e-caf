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

export function getSafeErrorMessage(error: unknown, fallback = 'Errore interno') {
  const err = error as SupabaseLikeError | Error | null
  if (!err) return fallback
  return 'message' in err && err.message ? err.message : fallback
}
