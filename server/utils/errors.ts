/**
 * Log a database/storage error and return a generic 500 to throw.
 * Logs only the error code and message — never request data (names, emails, phones, notes).
 *
 *   if (error) throw serverError('staff/notes', error, 'Could not add note')
 */
export function serverError(where: string, error: { code?: string; message: string }, publicMessage: string) {
  console.error(`[${where}]`, error.code ?? '', error.message)
  return createError({ statusCode: 500, statusMessage: publicMessage })
}
