import { useState } from 'react'
import { Check, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateWorkspace } from '@/features/auth/hooks'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Workspace } from '@/features/auth/types'

type Props = {
  workspace: Workspace | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApiKeyDialog({ workspace, open, onOpenChange }: Props) {
  const updateWorkspace = useUpdateWorkspace()
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleOpenChange = (o: boolean) => {
    if (!o) setVisible(false)
    onOpenChange(o)
  }

  const handleCopy = () => {
    if (!workspace) return
    navigator.clipboard.writeText(workspace.api_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = () => {
    if (!workspace) return
    toast.promise(
      updateWorkspace.mutateAsync({
        slug: workspace.slug,
        data: { regenerate_api_key: true },
      }),
      {
        loading: 'Regenerating API key…',
        success: 'API key regenerated successfully.',
        error: 'Failed to regenerate API key.',
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>API Key</DialogTitle>
          <DialogDescription>
            Use this key to authenticate requests to{' '}
            <span className='font-medium'>{workspace?.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label>Key</Label>
            <div className='flex gap-2'>
              <Input
                readOnly
                type={visible ? 'text' : 'password'}
                value={workspace?.api_key ?? ''}
                className='font-mono text-sm'
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide API key' : 'Show API key'}
              >
                {visible ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
              </Button>
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={handleCopy}
                aria-label='Copy API key'
              >
                {copied ? (
                  <Check className='size-4 text-green-500' />
                ) : (
                  <Copy className='size-4' />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <div className='space-y-1'>
            <p className='text-sm font-medium'>Regenerate Key</p>
            <p className='text-xs text-muted-foreground'>
              This will invalidate the current key immediately. Any integrations using it will stop
              working until updated.
            </p>
            <Button
              type='button'
              variant='destructive'
              size='sm'
              className='mt-2'
              disabled={updateWorkspace.isPending}
              onClick={handleRegenerate}
            >
              <RefreshCw className='mr-2 size-3.5' />
              {updateWorkspace.isPending ? 'Regenerating…' : 'Regenerate'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
