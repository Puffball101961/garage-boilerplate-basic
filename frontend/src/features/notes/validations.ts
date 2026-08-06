import { z } from 'zod'

/**
 * Zod schemas for the notes feature.
 * Limits here mirror the constraints in firebase/firestore.rules — change both together.
 */

export const createNoteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  body: z.string().trim().max(10000, 'Note must be less than 10,000 characters'),
})

export const updateNoteSchema = createNoteSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Nothing to update' }
)

export const noteIdSchema = z.string().trim().min(1, 'Note ID is required')

export type CreateNoteSchema = z.infer<typeof createNoteSchema>
export type UpdateNoteSchema = z.infer<typeof updateNoteSchema>
