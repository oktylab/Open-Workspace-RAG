import { z } from 'zod'

export const languageEnum = z.enum(['AR', 'FR', 'EN'])
export type Language = z.infer<typeof languageEnum>

export const jobDocumentActionEnum = z.enum(['CRAWLED', 'CREATED', 'UPDATED', 'DELETED'])
export type JobDocumentAction = z.infer<typeof jobDocumentActionEnum>

export const chunkResponseSchema = z.object({
  id: z.string().uuid(),
  chunk_index: z.number().int(),
  content: z.string(),
})
export type Chunk = z.infer<typeof chunkResponseSchema>

export const documentSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  is_approved: z.boolean(),
  url: z.string(),
  title: z.string().nullable().optional(),
  lang: languageEnum,
  tag: z.string().nullable().optional(),
  tag_id: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})
export type Document = z.infer<typeof documentSchema>

export const documentWithChunksSchema = documentSchema.extend({
  chunks: z.array(chunkResponseSchema),
})
export type DocumentWithChunks = z.infer<typeof documentWithChunksSchema>

export const paginatedDocumentsSchema = z.object({
  items: z.array(documentSchema),
  total: z.number().int(),
  skip: z.number().int(),
  limit: z.number().int(),
  language_counts: z.record(z.string(), z.number()).optional(),
})
export type PaginatedDocuments = z.infer<typeof paginatedDocumentsSchema>

export const documentFilterSchema = z.object({
  skip: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  document_ids: z.array(z.string().uuid()).optional(),
  job_ids: z.array(z.string().uuid()).optional(),
  is_approved: z.boolean().optional(),
  langs: z.array(languageEnum).optional(),
  actions: z.array(jobDocumentActionEnum).optional(),
  q: z.string().optional(),
})
export type DocumentFilters = z.infer<typeof documentFilterSchema>
