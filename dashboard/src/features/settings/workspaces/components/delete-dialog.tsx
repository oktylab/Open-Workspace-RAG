import { useDeleteWorkspace } from '@/features/auth/hooks'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Workspace } from '@/features/auth/types'

type Props = {
  workspace: Workspace | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteWorkspaceDialog({ workspace, open, onOpenChange }: Props) {
  const deleteWorkspace = useDeleteWorkspace()

  const handleDelete = async () => {
    if (!workspace) return
    await deleteWorkspace.mutateAsync(workspace.slug)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Delete Workspace</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            <span className='font-medium'>"{workspace?.name}"</span>? This action cannot be undone
            and will remove all associated documents and jobs.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={deleteWorkspace.isPending}
          >
            {deleteWorkspace.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
