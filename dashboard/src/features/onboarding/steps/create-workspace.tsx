import { Globe } from 'lucide-react'
import { WorkspaceCreateForm } from '@/features/settings/workspaces/components/workspace-create-form'

type Props = {
  onNext: () => void
}

export function CreateWorkspaceStep({ onNext }: Props) {
  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <div className='flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10'>
          <Globe className='size-6 text-primary' />
        </div>
        <div>
          <h2 className='text-xl font-bold tracking-tight'>Create your first workspace</h2>
          <p className='text-sm text-muted-foreground'>
            A workspace represents the website or project you want to index.
          </p>
        </div>
      </div>

      <WorkspaceCreateForm onSuccess={onNext} submitLabel='Create & Continue →' />
    </div>
  )
}
