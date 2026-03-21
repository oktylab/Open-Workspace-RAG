import { Globe } from 'lucide-react'
import { useState } from 'react'
import { useCurrentWorkspace, useWorkspaces } from '@/features/auth/hooks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Workspace } from '@/features/auth/types'
import { ApiKeyDialog } from './components/api-key-dialog'
import { CreateWorkspaceDialog } from './components/create-dialog'
import { DeleteWorkspaceDialog } from './components/delete-dialog'
import { EditWorkspaceDialog } from './components/edit-dialog'
import { WorkspaceRowActions } from './components/row-actions'

export function WorkspacesTable() {
  const { data: workspaces, isLoading } = useWorkspaces()
  const { workspace: currentWorkspace } = useCurrentWorkspace()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Workspace | null>(null)
  const [apiKeyTarget, setApiKeyTarget] = useState<Workspace | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null)

  if (isLoading) {
    return <div className='py-8 text-center text-muted-foreground'>Loading…</div>
  }

  return (
    <>
      <div className='mb-4 flex justify-end'>
        <Button onClick={() => setCreateOpen(true)}>Create Workspace</Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[300px]'>Workspace</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className='w-[100px]'>Status</TableHead>
              <TableHead className='w-[60px] text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workspaces?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className='py-8 text-center text-muted-foreground'>
                  No workspaces found. Create one to get started.
                </TableCell>
              </TableRow>
            )}
            {workspaces?.map((ws) => {
              const isCurrent = currentWorkspace?.id === ws.id
              return (
                <TableRow key={ws.id}>
                  <TableCell className='flex items-center gap-3'>
                    <div className='flex size-8 items-center justify-center rounded-lg bg-muted'>
                      <Globe className='size-4' />
                    </div>
                    <div className='flex flex-col'>
                      <span className='font-medium'>{ws.name}</span>
                      <span className='text-xs text-muted-foreground'>{ws.url}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className='text-xs text-muted-foreground'>{ws.slug}</code>
                  </TableCell>
                  <TableCell>
                    {isCurrent && <Badge variant='secondary'>Active</Badge>}
                  </TableCell>
                  <TableCell className='text-right'>
                    <WorkspaceRowActions
                      workspace={ws}
                      onEdit={setEditTarget}
                      onApiKey={setApiKeyTarget}
                      onDelete={setDeleteTarget}
                      deleteDisabled={isCurrent}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />

      <EditWorkspaceDialog
        workspace={editTarget}
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
      />

      <ApiKeyDialog
        workspace={apiKeyTarget}
        open={!!apiKeyTarget}
        onOpenChange={(o) => !o && setApiKeyTarget(null)}
      />

      <DeleteWorkspaceDialog
        workspace={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      />
    </>
  )
}
