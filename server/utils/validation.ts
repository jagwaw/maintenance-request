import { z } from 'zod'
import { CATEGORIES } from '~~/config/maintenance'
import { emailError, phoneError } from '~~/utils/contact'

const optionalText = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null)

/** Fields shared by the tenant form and the staff "new request" form. */
export const requestFieldsSchema = z
  .object({
    unitId: z.uuid(),
    contactName: z.string().trim().min(1).max(100),
    contactEmail: z.string().trim().toLowerCase().refine((e) => !emailError(e), 'Invalid email').optional(),
    contactPhone: z.string().trim().max(30).refine((p) => !phoneError(p), 'Invalid phone').optional(),
    category: z.string().refine((c) => c in CATEGORIES, 'Unknown category'),
    details: z.record(z.string(), z.string().trim().max(500)).default({}),
    description: z.string().trim().min(1).max(2000),
    permissionToEnter: z.boolean(),
    pets: optionalText(200),
    bestTimes: optionalText(200),
  })
  .superRefine((input, ctx) => {
    if (!input.contactEmail && !normalizePhone(input.contactPhone))
      ctx.addIssue({ code: 'custom', path: ['contactEmail'], message: 'Email or phone is required' })

    // Follow-up answers must belong to the chosen category, and select answers must be one of the options.
    const followUps = CATEGORIES[input.category]?.followUps ?? []
    for (const [id, answer] of Object.entries(input.details)) {
      const q = followUps.find((f) => f.id === id)
      if (!q) ctx.addIssue({ code: 'custom', path: ['details', id], message: 'Unknown question' })
      else if (q.type === 'select' && answer && !q.options?.includes(answer))
        ctx.addIssue({ code: 'custom', path: ['details', id], message: 'Invalid answer' })
    }
  })

export type RequestFields = z.infer<typeof requestFieldsSchema>

/** Parse with Zod and turn failures into a 400 that lists the bad fields. */
export function parseOr400<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success)
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    })
  return result.data
}
