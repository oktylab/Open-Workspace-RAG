/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { JobTypePicker, type JobCreationType } from '@/features/jobs/components/job-type-picker'
import { URLJobForm } from '@/features/jobs/components/url-job-form'
import { PdfJobForm } from '@/features/jobs/components/pdf-job-form'
import { useCreateJob, useCreatePdfJob } from '@/features/jobs/hooks'
import type { URLJobConfig } from '@/features/jobs/data/schema'

export const Route = createFileRoute('/_authenticated/jobs/create')({
  component: JobsCreate,
})

const PAGE_META: Record<JobCreationType, { title: string; desc: string }> = {
  url: {
    title: 'New URL Crawl Job',
    desc: 'Configure and schedule a crawl job for your workspace.',
  },
  pdf: {
    title: 'New PDF Job',
    desc: 'Upload PDF documents for text extraction and indexing.',
  },
}

function JobsCreate() {
  const navigate = useNavigate()
  const [jobType, setJobType] = useState<JobCreationType | null>(null)
  const createUrlJob = useCreateJob()
  const createPdfJob = useCreatePdfJob()

  const handleUrlSubmit = async (data: URLJobConfig) => {
    await createUrlJob.mutateAsync(data, {
      onSuccess: () => {
        toast.success('Job created and scheduled')
        navigate({ to: '/jobs' })
      },
      onError: () => toast.error('Failed to create job'),
    })
  }

  const handlePdfSubmit = async (files: File[]) => {
    await createPdfJob.mutateAsync(files, {
      onSuccess: () => {
        toast.success('PDF job created and scheduled')
        navigate({ to: '/jobs' })
      },
      onError: () => toast.error('Failed to upload PDFs'),
    })
  }

  const meta = jobType ? PAGE_META[jobType] : null

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
              onClick={() => {
                if (jobType) setJobType(null)
                else navigate({ to: '/jobs' })
              }}
            >
              <ArrowLeft className='h-4 w-4' />
              {jobType ? 'Change type' : 'Back to Jobs'}
            </Button>
          </div>

          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            {meta?.title ?? 'New Job'}
          </h1>
          <p className='text-muted-foreground'>
            {meta?.desc ?? 'Choose what type of job you want to create.'}
          </p>
        </div>

        <Separator className='my-4 lg:my-6' />

        <div className='flex flex-1 flex-col overflow-y-auto scroll-smooth pe-4 pb-12'>
          <div className='-mx-1 px-1.5 lg:max-w-3xl'>
            {!jobType && <JobTypePicker onSelect={setJobType} />}

            {jobType === 'url' && (
              <URLJobForm
                onSubmit={handleUrlSubmit}
                isPending={createUrlJob.isPending}
              />
            )}

            {jobType === 'pdf' && (
              <PdfJobForm
                onSubmit={handlePdfSubmit}
                isPending={createPdfJob.isPending}
              />
            )}
          </div>
        </div>
      </Main>
    </>
  )
}
