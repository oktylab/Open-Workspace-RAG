import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Circle,
  Plus,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  urlJobConfigSchema as jobConfigSchema,
  type FilterRule,
  type URLJobConfig as JobConfigInput,
} from '../data/schema'
import { filterTypes, languages } from '../data/data'

const STEPS = [
  { id: 'source', label: 'Source' },
  { id: 'crawling', label: 'Crawling' },
  { id: 'filtering', label: 'Filtering' },
  { id: 'formatting', label: 'Formatting' },
] as const
type StepId = (typeof STEPS)[number]['id']

type URLJobFormProps = {
  defaultValues?: Partial<JobConfigInput>
  onSubmit: (data: JobConfigInput) => Promise<void>
  isPending?: boolean
  isEditing?: boolean
}

function StepIndicator({
  currentStep,
  onStepClick,
  completedSteps,
}: {
  currentStep: StepId
  completedSteps: Set<StepId>
  onStepClick: (step: StepId) => void
}) {
  return (
    <div className='flex items-center gap-1'>
      {STEPS.map((step, i) => {
        const isCompleted = completedSteps.has(step.id)
        const isCurrent = step.id === currentStep
        return (
          <div key={step.id} className='flex items-center'>
            <button
              type='button'
              onClick={() => onStepClick(step.id)}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isCurrent && 'bg-primary text-primary-foreground',
                isCompleted && !isCurrent && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                !isCurrent && !isCompleted && 'text-muted-foreground hover:bg-muted'
              )}
            >
              {isCompleted ? (
                <Check className='h-4 w-4' />
              ) : (
                <Circle className={cn('h-4 w-4', isCurrent && 'fill-current')} />
              )}
              <span className='hidden sm:inline'>{step.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className='h-4 w-4 text-muted-foreground' />
            )}
          </div>
        )
      })}
    </div>
  )
}

function SourceStep({ form }: { form: ReturnType<typeof useForm> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const control = form.control as any
  return (
    <div className='space-y-4'>
      <div className='space-y-1.5'>
        <h3 className='text-sm font-semibold'>Target URL</h3>
        <p className='text-xs text-muted-foreground'>
          Enter the starting URL for the crawl. The crawler will follow links from this page.
        </p>
      </div>
      <FormField
        control={control}
        name='url'
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL</FormLabel>
            <FormControl>
              <Input
                placeholder='https://example.com'
                {...field}
                className='font-mono'
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function UrlFilterEditor({ rule, onChange, onRemove }: {
  rule: FilterRule
  onChange: (updated: FilterRule) => void
  onRemove: () => void
}) {
  const patterns = rule.type === 'url' ? rule.patterns : []
  const reverse = rule.type === 'url' ? rule.reverse : false

  const setPatterns = (next: string[]) => {
    if (rule.type === 'url') onChange({ ...rule, patterns: next })
  }
  const setReverse = (next: boolean) => {
    if (rule.type === 'url') onChange({ ...rule, reverse: next })
  }

  return (
    <div className='space-y-3 rounded-md border p-3'>
      <div className='flex items-center justify-between'>
        <Badge variant='outline'>URL Pattern</Badge>
        <Button type='button' variant='ghost' size='icon' className='h-6 w-6' onClick={onRemove}>
          <X className='h-3 w-3' />
        </Button>
      </div>
      <FormItem>
        <FormLabel className='text-xs'>Patterns (comma separated)</FormLabel>
        <FormControl>
          <Input
            placeholder='e.g., /blog/*, /products/*'
            value={patterns.join(', ')}
            onChange={(e) => setPatterns(e.target.value.split(',').map((p) => p.trim()).filter(Boolean))}
            className='h-7 text-xs'
          />
        </FormControl>
      </FormItem>
      <FormItem className='flex items-center space-x-2 space-y-0'>
        <FormControl>
          <Switch checked={reverse} onCheckedChange={setReverse} />
        </FormControl>
        <FormLabel className='text-xs font-normal'>Exclude matching URLs</FormLabel>
      </FormItem>
    </div>
  )
}

function DomainFilterEditor({ rule, onChange, onRemove }: {
  rule: FilterRule
  onChange: (updated: FilterRule) => void
  onRemove: () => void
}) {
  const allowed = rule.type === 'domain' ? rule.allowed : []
  const blocked = rule.type === 'domain' ? rule.blocked : []

  const setAllowed = (next: string[]) => {
    if (rule.type === 'domain') onChange({ ...rule, allowed: next })
  }
  const setBlocked = (next: string[]) => {
    if (rule.type === 'domain') onChange({ ...rule, blocked: next })
  }

  return (
    <div className='space-y-3 rounded-md border p-3'>
      <div className='flex items-center justify-between'>
        <Badge variant='outline'>Domain</Badge>
        <Button type='button' variant='ghost' size='icon' className='h-6 w-6' onClick={onRemove}>
          <X className='h-3 w-3' />
        </Button>
      </div>
      <FormItem>
        <FormLabel className='text-xs'>Allowed domains</FormLabel>
        <FormControl>
          <Input
            placeholder='example.com, api.example.com'
            value={allowed.join(', ')}
            onChange={(e) => setAllowed(e.target.value.split(',').map((p) => p.trim()).filter(Boolean))}
            className='h-7 text-xs'
          />
        </FormControl>
        <FormDescription className='text-xs'>Leave empty to allow all</FormDescription>
      </FormItem>
      <FormItem>
        <FormLabel className='text-xs'>Blocked domains</FormLabel>
        <FormControl>
          <Input
            placeholder='ads.example.com, spam.com'
            value={blocked.join(', ')}
            onChange={(e) => setBlocked(e.target.value.split(',').map((p) => p.trim()).filter(Boolean))}
            className='h-7 text-xs'
          />
        </FormControl>
      </FormItem>
    </div>
  )
}

function SeoFilterEditor({ rule, onChange, onRemove }: {
  rule: FilterRule
  onChange: (updated: FilterRule) => void
  onRemove: () => void
}) {
  const keywords = rule.type === 'seo' ? rule.keywords : []
  const threshold = rule.type === 'seo' ? rule.threshold : 0.5
  const [kwInput, setKwInput] = useState('')

  const addKeyword = () => {
    if (kwInput.trim() && rule.type === 'seo') {
      onChange({ ...rule, keywords: [...rule.keywords, kwInput.trim()] })
      setKwInput('')
    }
  }

  return (
    <div className='space-y-3 rounded-md border p-3'>
      <div className='flex items-center justify-between'>
        <Badge variant='outline'>SEO Keywords</Badge>
        <Button type='button' variant='ghost' size='icon' className='h-6 w-6' onClick={onRemove}>
          <X className='h-3 w-3' />
        </Button>
      </div>
      <FormItem>
        <FormLabel className='text-xs'>Keywords</FormLabel>
        <FormControl>
          <div className='flex flex-wrap gap-1'>
            {keywords.map((kw, i) => (
              <Badge key={i} variant='secondary' className='text-xs gap-1'>
                {kw}
                <button type='button' onClick={() => rule.type === 'seo' && onChange({ ...rule, keywords: rule.keywords.filter((_, idx) => idx !== i) })}>
                  <X className='h-3 w-3' />
                </button>
              </Badge>
            ))}
          </div>
        </FormControl>
        <div className='flex gap-1'>
          <Input
            placeholder='Add keyword...'
            value={kwInput}
            onChange={(e) => setKwInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword() } }}
            className='h-7 text-xs'
          />
          <Button type='button' size='sm' variant='outline' className='h-7 text-xs' onClick={addKeyword}>
            <Plus className='h-3 w-3' />
          </Button>
        </div>
      </FormItem>
      <FormItem>
        <FormLabel className='text-xs'>Threshold: {(threshold * 100).toFixed(0)}%</FormLabel>
        <FormControl>
          <Input
            type='number'
            value={threshold}
            min={0}
            max={1}
            step={0.05}
            onChange={(e) => rule.type === 'seo' && onChange({ ...rule, threshold: Number(e.target.value) })}
          />
        </FormControl>
        <FormDescription className='text-xs'>Minimum keyword density required</FormDescription>
      </FormItem>
    </div>
  )
}

function RelevanceFilterEditor({ rule, onChange, onRemove }: {
  rule: FilterRule
  onChange: (updated: FilterRule) => void
  onRemove: () => void
}) {
  const query = rule.type === 'relevance' ? rule.query : ''
  const threshold = rule.type === 'relevance' ? rule.threshold : 0.7

  return (
    <div className='space-y-3 rounded-md border p-3'>
      <div className='flex items-center justify-between'>
        <Badge variant='outline'>Relevance Query</Badge>
        <Button type='button' variant='ghost' size='icon' className='h-6 w-6' onClick={onRemove}>
          <X className='h-3 w-3' />
        </Button>
      </div>
      <FormItem>
        <FormLabel className='text-xs'>Query</FormLabel>
        <FormControl>
          <Input
            placeholder='What pages are about...'
            value={query}
            onChange={(e) => rule.type === 'relevance' && onChange({ ...rule, query: e.target.value })}
            className='h-7 text-xs'
          />
        </FormControl>
      </FormItem>
      <FormItem>
        <FormLabel className='text-xs'>Threshold: {(threshold * 100).toFixed(0)}%</FormLabel>
        <FormControl>
          <Input
            type='number'
            value={threshold}
            min={0}
            max={1}
            step={0.05}
            onChange={(e) => rule.type === 'relevance' && onChange({ ...rule, threshold: Number(e.target.value) })}
          />
        </FormControl>
      </FormItem>
    </div>
  )
}

function FilterRuleEditor({
  rule,
  onChange,
  onRemove,
}: {
  rule: FilterRule
  onChange: (updated: FilterRule) => void
  onRemove: () => void
}) {
  switch (rule.type) {
    case 'url':
      return <UrlFilterEditor rule={rule} onChange={onChange} onRemove={onRemove} />
    case 'domain':
      return <DomainFilterEditor rule={rule} onChange={onChange} onRemove={onRemove} />
    case 'seo':
      return <SeoFilterEditor rule={rule} onChange={onChange} onRemove={onRemove} />
    case 'relevance':
      return <RelevanceFilterEditor rule={rule} onChange={onChange} onRemove={onRemove} />
  }
}

function CrawlingStep({ form }: { form: ReturnType<typeof useForm> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const control = form.control as any
  const { fields: filterFields, append, remove } = useFieldArray({
    control,
    name: 'crawling.filters',
  })
  const [addFilterType, setAddFilterType] = useState<'url' | 'domain' | 'seo' | 'relevance'>('domain')
  const crawling = form.watch('crawling') as { filters?: unknown[] } | undefined

  const addFilter = () => {
    const defaults: Record<string, FilterRule> = {
      url: { type: 'url', patterns: [], reverse: false },
      domain: { type: 'domain', allowed: [], blocked: [] },
      seo: { type: 'seo', keywords: [], threshold: 0.5 },
      relevance: { type: 'relevance', query: '', threshold: 0.7 },
    }
    void append(defaults[addFilterType] as never)
  }

  const updateFilter = (index: number, updated: FilterRule) => {
    const current: FilterRule[] = form.getValues('crawling.filters') ?? []
    const updatedFilters = [...current]
    updatedFilters[index] = updated
    form.setValue('crawling.filters', updatedFilters as never, { shouldValidate: true })
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-1.5'>
        <h3 className='text-sm font-semibold'>Crawl Limits</h3>
        <p className='text-xs text-muted-foreground'>
          Control how deep and wide the crawler explores.
        </p>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <FormField
          control={control}
          name='crawling.max_depth'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Depth ({field.value})</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  value={field.value ?? 1}
                  min={1}
                  max={10}
                  step={1}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription className='text-xs'>Link-following depth</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name='crawling.max_pages'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Pages ({field.value})</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  value={field.value ?? 10}
                  min={1}
                  max={1000}
                  step={1}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription className='text-xs'>Total pages to crawl</FormDescription>
            </FormItem>
          )}
        />
      </div>

      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <div className='space-y-1'>
            <h3 className='text-sm font-semibold'>Filters</h3>
            <p className='text-xs text-muted-foreground'>
              Restrict which pages the crawler visits.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Select value={addFilterType} onValueChange={(v: typeof addFilterType) => setAddFilterType(v)}>
              <SelectTrigger className='h-7 w-[160px] text-xs'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterTypes.map((ft) => (
                  <SelectItem key={ft.value} value={ft.value} className='text-xs'>
                    {ft.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-7 gap-1 text-xs'
              onClick={addFilter}
            >
              <Plus className='h-3 w-3' /> Add
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          {filterFields.length === 0 && (
            <div className='rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground'>
              No filters added. Pages will be crawled without restrictions.
            </div>
          )}
          {filterFields.map((fieldItem, index) => {
            const rule = crawling?.filters?.[index] as FilterRule | undefined
            if (!rule) return null
            return (
              <FilterRuleEditor
                key={fieldItem.id}
                rule={rule}
                onChange={(updated) => updateFilter(index, updated)}
                onRemove={() => remove(index)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function FilteringStep({ form }: { form: ReturnType<typeof useForm> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const control = form.control as any
  const filtering = form.watch('filtering') as { languages?: unknown[] } | undefined

  return (
    <div className='space-y-6'>
      <div className='space-y-1.5'>
        <h3 className='text-sm font-semibold'>Content Filtering</h3>
        <p className='text-xs text-muted-foreground'>
          Filter pages by content characteristics after crawling.
        </p>
      </div>

      <FormField
        control={control}
        name='filtering.word_count_threshold'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Min Word Count ({field.value})</FormLabel>
            <FormControl>
              <Input
                type='number'
                value={field.value ?? 30}
                min={0}
                max={500}
                step={5}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormDescription className='text-xs'>
              Skip pages with fewer words than this threshold
            </FormDescription>
          </FormItem>
        )}
      />

      <FormItem>
        <FormLabel>Languages</FormLabel>
        <div className='flex flex-wrap gap-2'>
          {languages.map((lang) => {
            const selected = filtering?.languages ?? []
            const isSelected = selected.includes(lang.value as 'AR' | 'FR' | 'EN')
            return (
              <Badge
                key={lang.value}
                variant={isSelected ? 'default' : 'outline'}
                className='cursor-pointer gap-1 px-3 py-1'
                onClick={() => {
                  const current: Array<'AR' | 'FR' | 'EN'> = form.getValues('filtering.languages') ?? []
                  const updated = isSelected
                    ? current.filter((l) => l !== lang.value)
                    : [...current, lang.value as 'AR' | 'FR' | 'EN']
                  form.setValue('filtering.languages', updated.length > 0 ? updated : null)
                }}
              >
                {lang.label}
              </Badge>
            )
          })}
        </div>
        <FormDescription className='text-xs'>
          Select languages to keep. Leave empty to accept all.
        </FormDescription>
      </FormItem>
    </div>
  )
}

function FormattingStep({ form }: { form: ReturnType<typeof useForm> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const control = form.control as any
  const formating = form.watch('formating') as { threshold_type?: string; threshold?: number } | undefined

  return (
    <div className='space-y-6'>
      <div className='space-y-1.5'>
        <h3 className='text-sm font-semibold'>Content Formatting</h3>
        <p className='text-xs text-muted-foreground'>
          Configure how extracted content is processed and filtered.
        </p>
      </div>

      <FormField
        control={control}
        name='formating.user_query'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Relevance Query (optional)</FormLabel>
            <FormControl>
              <Input
                placeholder='e.g., "information about product features"'
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value || null)}
              />
            </FormControl>
            <FormDescription className='text-xs'>
              Used with dynamic thresholding to score page relevance
            </FormDescription>
          </FormItem>
        )}
      />

      <div className='grid grid-cols-2 gap-4'>
        <FormField
          control={control}
          name='formating.min_word_threshold'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Word Threshold ({field.value})</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  value={field.value ?? 20}
                  min={0}
                  max={200}
                  step={5}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name='formating.threshold'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Score Threshold ({((field.value ?? 0.6) * 100).toFixed(0)}%)</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  value={field.value ?? 0.6}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription className='text-xs'>
                {(formating?.threshold_type ?? 'dynamic') === 'dynamic'
                  ? 'Dynamic threshold baseline'
                  : 'Fixed minimum score'}
              </FormDescription>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name='formating.threshold_type'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Threshold Type</FormLabel>
            <Select value={field.value ?? 'dynamic'} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='dynamic'>Dynamic</SelectItem>
                <SelectItem value='fixed'>Fixed</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription className='text-xs'>
              Dynamic adjusts per-page based on content distribution
            </FormDescription>
          </FormItem>
        )}
      />

      <Accordion type='single' collapsible className='w-full'>
        <AccordionItem value='exclusions'>
          <AccordionTrigger className='text-sm'>Content Exclusions</AccordionTrigger>
          <AccordionContent>
            <div className='space-y-3 pt-2'>
              <div className='grid grid-cols-2 gap-3'>
                <FormField
                  control={control}
                  name='formating.ignore_links'
                  render={({ field }) => (
                    <FormItem className='flex items-center space-x-2 space-y-0'>
                      <FormControl>
                        <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className='font-normal text-xs'>Ignore links</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name='formating.ignore_images'
                  render={({ field }) => (
                    <FormItem className='flex items-center space-x-2 space-y-0'>
                      <FormControl>
                        <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className='font-normal text-xs'>Ignore images</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name='formating.skip_internal_links'
                  render={({ field }) => (
                    <FormItem className='flex items-center space-x-2 space-y-0'>
                      <FormControl>
                        <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className='font-normal text-xs'>Skip internal links</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name='formating.excluded_tags'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs'>Excluded selectors</FormLabel>
                    <FormControl>
                      <div className='flex flex-wrap gap-1.5'>
                        {(field.value ?? []).map((tag: string, i: number) => (
                          <Badge key={i} variant='secondary' className='text-xs'>
                            {tag}
                            <button
                              type='button'
                              className='ml-1 hover:text-destructive'
                              onClick={() => {
                                const updated = field.value?.filter((_: string, idx: number) => idx !== i)
                                field.onChange(updated)
                              }}
                            >
                              <X className='h-3 w-3' />
                            </button>
                          </Badge>
                        ))}
                        <Input
                          placeholder='Add selector...'
                          className='h-5 w-[120px] text-xs'
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              field.onChange([...(field.value ?? []), e.currentTarget.value.trim()])
                              e.currentTarget.value = ''
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className='text-xs'>
                      CSS selectors for page sections to exclude from content
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export function URLJobForm({ defaultValues, onSubmit, isPending, isEditing = false }: URLJobFormProps) {
  const [currentStep, setCurrentStep] = useState<StepId>('source')
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set())

  const form = useForm<JobConfigInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(jobConfigSchema) as any,
    defaultValues: {
      url: '',
      crawling: { max_depth: 1, max_pages: 10, filters: [] },
      filtering: { word_count_threshold: 30, languages: null },
      formating: {
        user_query: null,
        min_word_threshold: 20,
        threshold_type: 'dynamic',
        threshold: 0.6,
        ignore_links: false,
        ignore_images: true,
        skip_internal_links: false,
        excluded_tags: [
          'nav', 'footer', 'aside', 'header',
          '#footer', '.footer', '#header', '.header',
          '.copyright', '.cookie-banner', '#cookie-banner',
          '.sidebar', '#sidebar', '.menu', '#menu',
        ],
      },
      ...defaultValues,
    },
    mode: 'onChange',
  })

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)

  const validateCurrentStep = async () => {
    if (currentStep === 'source') {
      return form.trigger('url')
    }
    return true
  }

  const handleNext = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    const isValid = await validateCurrentStep()
    if (!isValid) return
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    const nextIndex = Math.min(currentStepIndex + 1, STEPS.length - 1)
    setCurrentStep(STEPS[nextIndex].id)
  }

  const handlePrev = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0)
    setCurrentStep(STEPS[prevIndex].id)
  }

  const handleSubmit = async (data: JobConfigInput) => {
    await onSubmit(data)
  }

  const isLastStep = currentStepIndex === STEPS.length - 1

  return (
    <Form {...form}>
      <form
        id='job-form'
        onSubmit={form.handleSubmit(handleSubmit)}
        className='flex flex-col'
      >
        <div className='mb-6'>
          <StepIndicator
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={(step) => {
              if (isEditing || step === 'source' || completedSteps.has(STEPS[STEPS.findIndex((s) => s.id === step) - 1]?.id ?? 'source')) {
                setCurrentStep(step)
              }
            }}
          />
        </div>

        <div className='min-h-[320px] flex-1 space-y-6'>
          {currentStep === 'source' && <SourceStep form={form as never} />}
          {currentStep === 'crawling' && <CrawlingStep form={form as never} />}
          {currentStep === 'filtering' && <FilteringStep form={form as never} />}
          {currentStep === 'formatting' && <FormattingStep form={form as never} />}
        </div>

        <div className='mt-6 flex items-center justify-between border-t pt-4'>
          <Button
            type='button'
            variant='outline'
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className='gap-1'
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>

          {isLastStep ? (
            <Button type='submit' disabled={isPending} className='gap-1'>
              {isPending ? 'Saving...' : isEditing ? 'Save' : 'Save & Run'}
            </Button>
          ) : (
            <Button
              type='button'
              onClick={handleNext}
              className='gap-1'
            >
              Next
              <ArrowRight className='h-4 w-4' />
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
