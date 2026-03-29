/* eslint-disable react-refresh/only-export-components */
import z from 'zod'
import { ArrowLeft, FileText, Info } from 'lucide-react'
import { useNavigate, createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { URLJobForm } from '@/features/jobs/components/url-job-form'
import { useJob, useUpdateJob } from '@/features/jobs/hooks'
import type { URLJobConfig } from '@/features/jobs/data/schema'

const editSearchSchema = z.object({
  jobId: z.string().uuid(),
})

export const Route = createFileRoute('/_authenticated/jobs/edit')({
  validateSearch: editSearchSchema,
  component: JobsEdit,
})

function JobsEdit() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const { data: job, isLoading } = useJob(search.jobId)
  const updateJob = useUpdateJob()

  const handleUrlSubmit = async (data: URLJobConfig) => {
    await updateJob.mutateAsync(
      { jobId: search.jobId, config: data },
      {
        onSuccess: () => {
          toast.success('Job updated')
          navigate({ to: '/jobs' })
        },
        onError: () => toast.error('Failed to update job'),
      }
    )
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className='flex flex-1 items-center justify-center py-16'>
          <p className='text-muted-foreground'>Loading job...</p>
        </div>
      )
    }

    if (!job) {
      return (
        <div className='flex flex-1 items-center justify-center py-16'>
          <p className='text-destructive'>Job not found</p>
        </div>
      )
    }

    // ── PDF jobs ──────────────────────────────────────────────────────────────
    if (job.config?.type === 'pdf') {
      return (
        <div className='lg:max-w-3xl space-y-4'>
          <div className='flex items-start gap-3 rounded-lg border bg-muted/30 p-4'>
            <Info className='h-4 w-4 mt-0.5 shrink-0 text-muted-foreground' />
            <p className='text-sm text-muted-foreground'>
              PDF jobs cannot be reconfigured. To process different files, create a new PDF job.
              You can re-run this job from the{' '}
              <button
                className='underline underline-offset-2 hover:text-foreground'
                onClick={() => navigate({ to: '/jobs/$jobId', params: { jobId: job.id } })}
              >
                job detail page
              </button>
              .
            </p>
          </div>

          <div className='rounded-lg border bg-card'>
            <div className='px-4 py-3 border-b'>
              <p className='text-sm font-medium'>Files in this job</p>
            </div>
            <div className='px-4 py-2 divide-y'>
              {job.config.storage_keys.map((key) => (
                <div key={key} className='flex items-center gap-2 py-2.5'>
                  <FileText className='h-4 w-4 shrink-0 text-muted-foreground' />
                  <code className='text-xs text-muted-foreground break-all'>{key}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    // ── URL jobs ──────────────────────────────────────────────────────────────
    const defaultValues: Partial<URLJobConfig> =
      job.config?.type === 'url'
        ? {
            url: job.config.url,
            crawling: job.config.crawling ?? undefined,
            filtering: job.config.filtering,
            formating: job.config.formating,
          }
        : { url: '' }

    return (
      <div className='flex flex-1 flex-col overflow-y-auto scroll-smooth pe-4 pb-12'>
        <div className='-mx-1 px-1.5 lg:max-w-3xl'>
          <URLJobForm
            defaultValues={defaultValues}
            onSubmit={handleUrlSubmit}
            isPending={updateJob.isPending}
            isEditing
          />
        </div>
      </div>
    )
  }

  const title = job?.config?.type === 'pdf' ? 'PDF Job Details' : 'Edit URL Job'
  const desc =
    job?.config?.type === 'pdf'
      ? 'View the files associated with this job.'
      : 'Update the configuration for this crawl job.'

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
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            {isLoading ? 'Edit Job' : title}
          </h1>
          <p className='text-muted-foreground'>
            {isLoading ? '' : desc}
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />
        {renderContent()}
      </Main>
    </>
  )
}
