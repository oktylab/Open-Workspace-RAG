import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useUpdateWorkspace } from '@/features/auth/hooks'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Workspace } from '@/features/auth/types'
import { OriginsInput } from './origins-input'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().min(1, 'URL is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
})

type FormData = z.infer<typeof schema>

type Props = {
  workspace: Workspace | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditWorkspaceDialog({ workspace, open, onOpenChange }: Props) {
  const updateWorkspace = useUpdateWorkspace()
  const [form, setForm] = useState<FormData>({
    name: workspace?.name ?? '',
    url: workspace?.url ?? '',
    slug: workspace?.slug ?? '',
  })
  const [origins, setOrigins] = useState<string[]>(workspace?.allowed_origins ?? [])
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    if (open && workspace) {
      setForm({ name: workspace.name, url: workspace.url, slug: workspace.slug })
      setOrigins(workspace.allowed_origins ?? [])
      setErrors({})
    }
  }, [open, workspace])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspace) return
    const result = schema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormData
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    try {
      await updateWorkspace.mutateAsync({
        slug: workspace.slug,
        data: { ...result.data, allowed_origins: origins },
      })
      onOpenChange(false)
    } catch {
      setErrors({ name: 'Failed to update workspace. Please try again.' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Edit Workspace</DialogTitle>
          <DialogDescription>Update workspace details and allowed origins.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='edit-name'>Name</Label>
            <Input
              id='edit-name'
              placeholder='My Workspace'
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <p className='text-sm text-destructive'>{errors.name}</p>}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='edit-url'>URL</Label>
            <Input
              id='edit-url'
              placeholder='https://example.com'
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              onBlur={(e) => {
                const url = e.target.value.trim()
                if (url && !origins.includes(url)) setOrigins([...origins, url])
              }}
            />
            {errors.url && <p className='text-sm text-destructive'>{errors.url}</p>}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='edit-slug'>Slug</Label>
            <Input
              id='edit-slug'
              placeholder='my-workspace'
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            {errors.slug && <p className='text-sm text-destructive'>{errors.slug}</p>}
          </div>
          <OriginsInput value={origins} onChange={setOrigins} />
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={updateWorkspace.isPending}>
              {updateWorkspace.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
