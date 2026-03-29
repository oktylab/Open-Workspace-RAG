import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Eye, Pencil, Play, Trash2, FileText } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRunJobs } from '../hooks'
import type { Job } from '../data/schema'
import { useJobsContext } from './provider'

type JobsRowActionsProps = {
  row: Row<Job>
}

export function JobsRowActions({ row }: JobsRowActionsProps) {
  const job = row.original
  const { setOpen, setCurrentRow } = useJobsContext()
  const navigate = useNavigate()
  const runJobs = useRunJobs()

  const canEdit = job.status !== 'STARTED' && job.status !== 'PENDING' && job.config?.type !== 'pdf'
  const canRun = job.status === 'FAILURE' || job.status === 'SUCCESS'

  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast.promise(runJobs.mutateAsync([job.id]), {
      loading: 'Re-running job...',
      success: 'Job re-run scheduled',
      error: 'Failed to re-run job',
    })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentRow(job)
    setOpen('delete')
  }

  const handleViewDocuments = (e: React.MouseEvent) => {
    e.stopPropagation()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({ to: '/documents', search: { job_ids: [job.id] } as any })
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            navigate({ to: '/jobs/$jobId', params: { jobId: job.id } })
          }}
        >
          <Eye className='mr-2 h-4 w-4' />
          View
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleViewDocuments}
        >
          <FileText className='mr-2 h-4 w-4' />
          Documents
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            navigate({ to: '/jobs/edit', search: { jobId: job.id } })
          }}
          disabled={!canEdit}
        >
          <Pencil className='mr-2 h-4 w-4' />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleRun}
          disabled={!canRun || runJobs.isPending}
        >
          <Play className='mr-2 h-4 w-4' />
          Re-run
          <DropdownMenuShortcut>
            <Play size={14} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className='text-destructive focus:text-destructive'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Delete
          <DropdownMenuShortcut>
            <Trash2 size={14} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
