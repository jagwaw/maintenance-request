import { z } from 'zod'
import { SOURCES } from '~~/config/maintenance'

// Staff enter requests that came in some other way than the online form.
const sourceSchema = z.object({
  source: z.string().refine((s) => s in SOURCES && s !== 'form', 'Choose how the request came in'),
})

/** Staff: create a request on a tenant's behalf (phone, text, in person). */
export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event)
  const { data, photos } = await readRequestBody(event)
  const { source } = parseOr400(sourceSchema, data)
  const input = parseOr400(requestFieldsSchema, data)

  return await createRequest(event, input, photos, { actor: staff.email, source, createdByStaffId: staff.id })
})
