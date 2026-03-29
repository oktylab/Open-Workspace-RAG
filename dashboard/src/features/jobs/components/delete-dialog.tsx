import { AlertTriangle } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useDeleteJobs } from '../hooks'
import { useJobsContext } from './provider'

export function JobsDeleteDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useJobsContext()
  const deleteJobs = useDeleteJobs()

  if (!currentRow) return null

  return (
    <ConfirmDialog
      destructive
      open={open === 'delete'}
      onOpenChange={(v) => {
        if (!v) {
          setTimeout(() => setCurrentRow(null), 500)
        }
        setOpen(v ? 'delete' : null)
      }}
      handleConfirm={() => {
        deleteJobs.mutate([currentRow.id], {
          onSettled: () => {
            setOpen(null)
            setTimeout(() => setCurrentRow(null), 500)
          },
        })
      }}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Delete job?
        </span>
      }
      desc={
        <>
          You are about to delete the job for{' '}
          <strong>
            {currentRow.config?.type === 'url'
              ? currentRow.config.url
              : currentRow.config?.type === 'pdf'
                ? `${currentRow.config.storage_keys.length} PDF file(s)`
                : currentRow.id}
          </strong>
          . This action cannot be undone.
        </>
      }
      confirmText='Delete'
    />
  )
}
