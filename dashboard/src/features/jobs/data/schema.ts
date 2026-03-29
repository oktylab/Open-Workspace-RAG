import { z } from 'zod'

export const languageEnum = z.enum(['AR', 'FR', 'EN'])
export type Language = z.infer<typeof languageEnum>

export const jobStatusEnum = z.enum(['PENDING', 'STARTED', 'SUCCESS', 'FAILURE'])
export type JobStatusValue = z.infer<typeof jobStatusEnum>

export const filterRuleTypeEnum = z.enum(['url', 'domain', 'seo', 'relevance'])
export type FilterRuleType = z.infer<typeof filterRuleTypeEnum>

export const thresholdTypeEnum = z.enum(['fixed', 'dynamic'])
export type ThresholdType = z.infer<typeof thresholdTypeEnum>

export const filterRuleSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('url'),
    patterns: z.array(z.string()),
    reverse: z.boolean(),
  }),
  z.object({
    type: z.literal('domain'),
    allowed: z.array(z.string()),
    blocked: z.array(z.string()),
  }),
  z.object({
    type: z.literal('seo'),
    keywords: z.array(z.string()),
    threshold: z.number(),
  }),
  z.object({
    type: z.literal('relevance'),
    query: z.string(),
    threshold: z.number(),
  }),
])
export type FilterRule = z.infer<typeof filterRuleSchema>

export const crawlingConfigSchema = z.object({
  max_depth: z.number().int().min(1).max(10),
  max_pages: z.number().int().min(1).max(1000),
  filters: z.array(filterRuleSchema),
})
export type CrawlingConfig = z.infer<typeof crawlingConfigSchema>

export const filteringConfigSchema = z.object({
  word_count_threshold: z.number().int().min(0),
  languages: z.array(languageEnum).nullable(),
})
export type FilteringConfig = z.infer<typeof filteringConfigSchema>

export const formatingConfigSchema = z.object({
  user_query: z.string().nullable(),
  min_word_threshold: z.number().int().min(0),
  threshold_type: z.enum(['fixed', 'dynamic']),
  threshold: z.number().min(0).max(1),
  ignore_links: z.boolean(),
  ignore_images: z.boolean(),
  skip_internal_links: z.boolean(),
  excluded_tags: z.array(z.string()),
})
export type FormatingConfig = z.infer<typeof formatingConfigSchema>

// ── URL job ───────────────────────────────────────────────────────────────────
export const urlJobConfigSchema = z.object({
  type: z.literal('url').default('url'),
  url: z.string().url('Please enter a valid URL'),
  crawling: crawlingConfigSchema.optional(),
  filtering: filteringConfigSchema,
  formating: formatingConfigSchema,
})
export type URLJobConfig = z.infer<typeof urlJobConfigSchema>
/** Alias kept so the job-form and hooks don't need changes */
export const jobConfigSchema = urlJobConfigSchema
export type JobConfigInput = URLJobConfig

export const jobPageResultSchema = z.object({
  url: z.string(),
  title: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
})
export type JobPageResult = z.infer<typeof jobPageResultSchema>

export const jobSummarySchema = z.object({
  total: z.number().int(),
  succeeded: z.number().int(),
  failed: z.number().int(),
  skipped: z.number().int(),
})
export type JobSummary = z.infer<typeof jobSummarySchema>

export const urlJobResultSchema = z.object({
  type: z.literal('url'),
  failed: z.array(jobPageResultSchema),
  skipped: z.array(jobPageResultSchema),
  summary: jobSummarySchema,
})
export type URLJobResult = z.infer<typeof urlJobResultSchema>

// ── PDF job ───────────────────────────────────────────────────────────────────
export const pdfJobConfigSchema = z.object({
  type: z.literal('pdf'),
  storage_keys: z.array(z.string()),
  bucket: z.string(),
})
export type PDFJobConfig = z.infer<typeof pdfJobConfigSchema>

export const pdfFileResultSchema = z.object({
  key: z.string(),
  filename: z.string(),
  pages: z.number().int(),
  error: z.string().nullable().optional(),
})
export type PDFFileResult = z.infer<typeof pdfFileResultSchema>

export const pdfJobResultSchema = z.object({
  type: z.literal('pdf'),
  files: z.array(pdfFileResultSchema),
  summary: jobSummarySchema,
})
export type PDFJobResult = z.infer<typeof pdfJobResultSchema>

// ── Union types ───────────────────────────────────────────────────────────────
export const anyJobConfigSchema = z.discriminatedUnion('type', [
  urlJobConfigSchema,
  pdfJobConfigSchema,
])
export type AnyJobConfig = z.infer<typeof anyJobConfigSchema>

export const anyJobResultSchema = z.discriminatedUnion('type', [
  urlJobResultSchema,
  pdfJobResultSchema,
])
export type AnyJobResult = z.infer<typeof anyJobResultSchema>

// ── Job entity ────────────────────────────────────────────────────────────────
export const jobSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().nullable().optional(),
  workspace_id: z.string().uuid(),
  status: jobStatusEnum,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  config: anyJobConfigSchema.nullable().optional(),
  result: anyJobResultSchema.nullable().optional(),
})
export type Job = z.infer<typeof jobSchema>

export const paginatedJobsSchema = z.object({
  items: z.array(jobSchema),
  total: z.number().int(),
  skip: z.number().int(),
  limit: z.number().int(),
})
export type PaginatedJobs = z.infer<typeof paginatedJobsSchema>
