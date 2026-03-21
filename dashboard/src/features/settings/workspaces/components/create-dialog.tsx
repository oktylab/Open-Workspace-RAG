import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { WorkspaceCreateForm } from './workspace-create-form'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWorkspaceDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>Add a new workspace to your organization.</DialogDescription>
        </DialogHeader>
        <WorkspaceCreateForm
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
