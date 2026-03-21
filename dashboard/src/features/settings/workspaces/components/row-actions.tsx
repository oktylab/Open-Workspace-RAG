import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Key, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Workspace } from '@/features/auth/types'

type Props = {
  workspace: Workspace
  onEdit: (workspace: Workspace) => void
  onApiKey: (workspace: Workspace) => void
  onDelete: (workspace: Workspace) => void
  deleteDisabled?: boolean
}

export function WorkspaceRowActions({
  workspace,
  onEdit,
  onApiKey,
  onDelete,
  deleteDisabled,
}: Props) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-40'>
        <DropdownMenuItem onClick={() => onEdit(workspace)}>
          <Pencil className='mr-2 h-4 w-4' />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onApiKey(workspace)}>
          <Key className='mr-2 h-4 w-4' />
          API Key
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant='destructive'
          disabled={deleteDisabled}
          onClick={() => onDelete(workspace)}
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
