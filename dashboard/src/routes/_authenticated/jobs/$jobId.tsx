/* eslint-disable react-refresh/only-export-components */
import {
  ArrowLeft,
  LayoutDashboard,
  Loader2, 
  ExternalLink,
  AlertCircle,
  FileText
} from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useJob, useRunJobs, useJobProgress } from '@/features/jobs/hooks'
import { jobStatuses } from '@/features/jobs/data/data'
import type { Job, AnyJobConfig, AnyJobResult } from '@/features/jobs/data/schema'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

export const Route = createFileRoute('/_authenticated/jobs/$jobId')({
  component: JobDetail,
})

function JobContentSection({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-1 flex-col'>
      <div className='flex-none'>
        <h3 className='text-lg font-medium'>{title}</h3>
        <p className='text-sm text-muted-foreground'>{desc}</p>
      </div>
      <Separator className='my-4 flex-none' />
      <div className='faded-bottom h-full w-full overflow-y-auto scroll-smooth pe-4 pb-12'>
        <div className='-mx-1 px-1.5 lg:max-w-3xl'>{children}</div>
      </div>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-3 border-b border-border/50 last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-right text-foreground">{value}</span>
    </div>
  )
}

function JobDetail() {
  const { jobId } = Route.useParams()
  const navigate = Route.useNavigate()
  const { data: job, isLoading } = useJob(jobId)
  const runJobs = useRunJobs()
  const [activeTab, setActiveTab] = useState('overview')

  useJobProgress(job)

  const statusInfo = job
    ? jobStatuses.find((s) => s.value === job.status)
    : null

  const handleRerun = () => {
    if (!job) return
    toast.promise(runJobs.mutateAsync([job.id]), {
      loading: 'Re-running job...',
      success: 'Job re-run scheduled',
      error: 'Failed to re-run job',
    })
  }

  const sidebarNavItems = [
    {
      id: 'overview',
      title: 'Overview',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'errors',
      title: 'Errors',
      icon: <AlertCircle size={18} />,
    }
  ]

  if (isLoading) {
    return (
      <>
        <Header>
          <Search />
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main fixed>
          <div className='space-y-4'>
            <Skeleton className='h-8 w-32' />
            <Skeleton className='h-12 w-64' />
            <Skeleton className='h-64 w-full' />
          </div>
        </Main>
      </>
    )
  }

  if (!job) {
    return (
      <>
        <Header>
          <Search />
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main fixed>
          <div className='flex flex-1 items-center justify-center'>
            <div className='text-destructive'>Job not found</div>
          </div>
        </Main>
      </>
    )
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
          </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <div className='flex items-center gap-2 mb-2'>
            <Button
              variant='ghost'
              size='sm'
              className='gap-1 -ml-3'
              onClick={() => navigate({ to: '/jobs' })}
            >
              <ArrowLeft className='h-4 w-4' />
              Back to Jobs
            </Button>
          </div>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <div className='flex items-center gap-3'>
                <h1 className='text-2xl font-bold tracking-tight md:text-3xl truncate max-w-[300px] md:max-w-md lg:max-w-xl'>
                  {job.config?.type === 'url'
                    ? job.config.url
                    : job.config?.type === 'pdf'
                      ? `${job.config.storage_keys.length} file(s)`
                      : 'Job'}
                </h1>
                {statusInfo && (
                  <Badge variant='outline' className='gap-1 h-6'>
                    <statusInfo.icon className='h-3 w-3' />
                    {statusInfo.label}
                  </Badge>
                )}
              </div>
              <p className='text-muted-foreground mt-1 text-sm'>
                Job ID: <code className='text-xs'>{job.id}</code>
                {job.task_id && (
                  <>
                    {' '}· Task: <code className='text-xs'>{job.task_id}</code>
                  </>
                )}
              </p>
            </div>
            
            <div className='flex gap-2 shrink-0'>
              <Button
                variant='outline'
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={() => navigate({ to: '/documents', search: { job_ids: [job.id] } as any })}
                className='gap-1'
              >
                <FileText className='h-4 w-4' />
                Documents
              </Button>
              {job.status === 'SUCCESS' || job.status === 'FAILURE' ? (
                <Button onClick={handleRerun} disabled={runJobs.isPending} className='gap-1'>
                  <ExternalLink className='h-4 w-4' />
                  Re-run
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        
        <Separator className='my-4 lg:my-6' />
        
        <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <aside className='top-0 lg:sticky lg:w-1/5'>
            <div className='p-1 md:hidden'>
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className='h-12 w-full'>
                  <SelectValue placeholder='Select Tab' />
                </SelectTrigger>
                <SelectContent>
                  {sidebarNavItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className='flex gap-x-4 px-2 py-1'>
                        <span className='scale-125'>{item.icon}</span>
                        <span className='text-md'>{item.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea
              orientation='horizontal'
              type='always'
              className='hidden w-full min-w-40 bg-background px-1 py-2 md:block'
            >
              <nav className='flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0'>
                {sidebarNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      buttonVariants({ variant: 'ghost' }),
                      activeTab === item.id
                        ? 'bg-muted hover:bg-muted'
                        : 'hover:bg-transparent hover:underline',
                      'justify-start'
                    )}
                  >
                    <span className='me-2'>{item.icon}</span>
                    {item.title}
                  </button>
                ))}
              </nav>
            </ScrollArea>
          </aside>
          
          <div className='flex w-full overflow-y-auto p-1 pr-4'>
            <div className='w-full'>
              {activeTab === 'overview' && (
                <JobContentSection title='Overview' desc='Job details and configuration'>
                  <div className='space-y-8'>
                    
                    {!job.result && (job.status === 'PENDING' || job.status === 'STARTED') && (
                      <div className='flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed'>
                        <Loader2 className='mx-auto h-8 w-8 animate-spin text-muted-foreground mb-4' />
                        <p className='text-sm text-muted-foreground'>
                          {job.status === 'PENDING'
                            ? job.config?.type === 'pdf'
                              ? 'Job is pending and will start extracting shortly.'
                              : 'Job is pending and will start crawling shortly.'
                            : 'Job is currently running. Results will appear here when complete.'}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className='font-medium mb-3 text-sm text-muted-foreground'>Job Details</h4>
                      <div className='rounded-md border bg-card'>
                        <div className='px-4'>
                          <DataRow label="Status" value={statusInfo?.label ?? job.status} />
                          <DataRow label="Created" value={new Date(job.created_at).toLocaleString()} />
                          <DataRow label="Updated" value={new Date(job.updated_at).toLocaleString()} />
                          {job.result && (
                            <JobResultSummaryRows result={job.result} />
                          )}
                        </div>
                      </div>
                    </div>

                    <JobConfigDisplay config={job.config} />
                  </div>
                </JobContentSection>
              )}
              
              {activeTab === 'errors' && (
                <JobResultErrorsSection result={job.result ?? null} />
              )}
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}

function PageItem({
  url,
  title,
  error,
  reason,
}: {
  url: string
  title?: string | null
  error?: string | null
  reason?: string | null
}) {
  return (
    <div className='flex flex-col space-y-1 border-b pb-4 last:border-0'>
      <a
        href={url}
        target='_blank'
        rel='noopener noreferrer'
        className='text-sm font-medium hover:underline truncate block'
      >
        {title || url}
      </a>
      <span className='text-xs text-muted-foreground break-all'>{url}</span>
      {error && (
        <div className='rounded-md bg-destructive/10 p-3 mt-1'>
          <p className='text-xs font-mono text-destructive break-words whitespace-pre-wrap'>
            {error}
          </p>
        </div>
      )}
      {reason && (
        <p className='text-sm text-yellow-600 dark:text-yellow-500 mt-1'>
          Skipped: {reason}
        </p>
      )}
    </div>
  )
}

function PageResultsList({
  pages,
  type,
}: {
  pages: Array<{ url: string; title?: string | null; reason?: string | null; error?: string | null }>
  type: 'error' | 'skipped'
}) {
  if (pages.length === 0) {
    return (
      <div className='text-center py-8 text-sm text-muted-foreground border rounded-md border-dashed'>
        No {type === 'error' ? 'failed' : 'skipped'} pages
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {pages.map((page, i) => (
        <PageItem key={i} {...page} />
      ))}
    </div>
  )
}

function JobConfigDisplay({ config }: { config: AnyJobConfig | null | undefined }) {
  if (!config) return null

  return (
    <div>
      <h4 className='text-sm font-medium mb-3 text-muted-foreground'>Configuration</h4>
      <div className='rounded-md border bg-card'>
        <div className='px-4'>
          {config.type === 'url' && (
            <>
              <DataRow
                label="Source URL"
                value={<code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">{config.url}</code>}
              />
              {config.crawling && (
                <>
                  <DataRow label="Max Depth" value={config.crawling.max_depth.toString()} />
                  <DataRow label="Max Pages" value={config.crawling.max_pages.toString()} />
                  <DataRow label="URL Filters" value={`${config.crawling.filters.length} rules`} />
                </>
              )}
              {config.filtering && (
                <>
                  <DataRow label="Min Word Count" value={config.filtering.word_count_threshold.toString()} />
                  <DataRow label="Languages Allowed" value={config.filtering.languages?.join(', ') ?? 'All'} />
                </>
              )}
              {config.formating && (
                <>
                  <DataRow
                    label="Relevance Query"
                    value={config.formating.user_query ? `"${config.formating.user_query}"` : 'None'}
                  />
                  <DataRow
                    label="Relevance Threshold"
                    value={`${(config.formating.threshold * 100).toFixed(0)}% (${config.formating.threshold_type})`}
                  />
                  <DataRow label="Formatting Min Words" value={config.formating.min_word_threshold.toString()} />
                  <DataRow label="Ignore Links" value={config.formating.ignore_links ? 'Yes' : 'No'} />
                  <DataRow label="Ignore Images" value={config.formating.ignore_images ? 'Yes' : 'No'} />
                  <DataRow label="Skip Internal Links" value={config.formating.skip_internal_links ? 'Yes' : 'No'} />
                  <DataRow label="Excluded Tags" value={`${config.formating.excluded_tags.length} tags`} />
                </>
              )}
            </>
          )}

          {config.type === 'pdf' && (
            <>
              <DataRow label="Bucket" value={<code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">{config.bucket}</code>} />
              <DataRow label="Files" value={config.storage_keys.length.toString()} />
              {config.storage_keys.map((key) => (
                <DataRow key={key} label="" value={<code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs break-all">{key}</code>} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function JobResultSummaryRows({ result }: { result: AnyJobResult }) {
  const { summary } = result
  const isUrl = result.type === 'url'
  return (
    <>
      <DataRow label={isUrl ? 'Total Pages' : 'Total Files'} value={summary.total.toString()} />
      <DataRow label="Succeeded" value={summary.succeeded.toString()} />
      <DataRow label="Failed" value={summary.failed.toString()} />
      <DataRow label="Skipped" value={summary.skipped.toString()} />
    </>
  )
}

function JobResultErrorsSection({ result }: { result: AnyJobResult | null }) {
  if (!result) {
    return (
      <JobContentSection title='Errors & Skipped' desc='Detailed view of failed and skipped items'>
        <div className='text-center py-12 text-sm text-muted-foreground'>
          No results available yet.
        </div>
      </JobContentSection>
    )
  }

  if (result.type === 'url') {
    return (
      <JobContentSection title='Errors & Skipped Pages' desc='Detailed view of failed and skipped pages'>
        <Tabs defaultValue='failed' className='w-full'>
          <TabsList>
            <TabsTrigger value='failed'>Failed ({result.failed.length})</TabsTrigger>
            <TabsTrigger value='skipped'>Skipped ({result.skipped.length})</TabsTrigger>
          </TabsList>
          <TabsContent value='failed' className='mt-6'>
            <PageResultsList pages={result.failed} type='error' />
          </TabsContent>
          <TabsContent value='skipped' className='mt-6'>
            <PageResultsList pages={result.skipped} type='skipped' />
          </TabsContent>
        </Tabs>
      </JobContentSection>
    )
  }

  const failedFiles = result.files.filter((f) => f.error)
  return (
    <JobContentSection title='Errors' desc='Files that failed to process'>
      {failedFiles.length === 0 ? (
        <div className='text-center py-8 text-sm text-muted-foreground border rounded-md border-dashed'>
          No failed files
        </div>
      ) : (
        <div className='space-y-4'>
          {failedFiles.map((f, i) => (
            <div key={i} className='flex flex-col space-y-1 border-b pb-4 last:border-0'>
              <span className='text-sm font-medium'>{f.filename}</span>
              <code className='text-xs text-muted-foreground break-all'>{f.key}</code>
              <div className='rounded-md bg-destructive/10 p-3 mt-1'>
                <p className='text-xs font-mono text-destructive break-words whitespace-pre-wrap'>{f.error}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </JobContentSection>
  )
}
