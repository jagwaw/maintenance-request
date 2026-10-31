import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

type EventType = 'created' | 'status_changed' | 'assigned' | 'note_added'

/** Every change to a request is recorded here — one timeline per request. */
export async function logEvent(
  event: H3Event,
  entry: { requestId: string; actor: string; type: EventType; fromValue?: string | null; toValue?: string | null; note?: string | null },
) {
  const db = serverSupabaseServiceRole(event)
  const { error } = await db.from('request_events').insert({
    request_id: entry.requestId,
    actor: entry.actor,
    type: entry.type,
    from_value: entry.fromValue ?? null,
    to_value: entry.toValue ?? null,
    note: entry.note ?? null,
  })
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not save history' })
}
