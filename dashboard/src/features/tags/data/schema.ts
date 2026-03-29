import { z } from 'zod'

export const tagSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  path: z.string(),
  label: z.string(),
  description: z.string().nullable().optional(),
})
export type Tag = z.infer<typeof tagSchema>

export const tagCreateSchema = z.object({
  path: z.string().regex(/^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$/),
  label: z.string().min(1).optional(),
  description: z.string().optional(),
})
export type TagCreate = z.infer<typeof tagCreateSchema>

export const tagUpdateSchema = z.object({
  label: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
})
export type TagUpdate = z.infer<typeof tagUpdateSchema>
