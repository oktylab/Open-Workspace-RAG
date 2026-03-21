import { useState } from 'react'
import { z } from 'zod'
import { useCreateWorkspace } from '@/features/auth/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  onSuccess?: () => void
  onCancel?: () => void
  submitLabel?: string
}

export function WorkspaceCreateForm({
  onSuccess,
  onCancel,
  submitLabel = 'Create',
}: Props) {
  const createWorkspace = useCreateWorkspace()
  const [form, setForm] = useState<FormData>({ name: '', url: '', slug: '' })
  const [origins, setOrigins] = useState<string[]>([])
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      await createWorkspace.mutateAsync({ ...result.data, allowed_origins: origins })
      onSuccess?.()
    } catch {
      setErrors({ name: 'Failed to create workspace. Please try again.' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='ws-name'>Name</Label>
        <Input
          id='ws-name'
          placeholder='My Workspace'
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })
          }
        />
        {errors.name && <p className='text-sm text-destructive'>{errors.name}</p>}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='ws-url'>URL</Label>
        <Input
          id='ws-url'
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
        <Label htmlFor='ws-slug'>Slug</Label>
        <Input
          id='ws-slug'
          placeholder='my-workspace'
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
        />
        {errors.slug && <p className='text-sm text-destructive'>{errors.slug}</p>}
      </div>

      <OriginsInput value={origins} onChange={setOrigins} />

      <div className='flex justify-end gap-2 pt-2'>
        {onCancel && (
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type='submit' disabled={createWorkspace.isPending}>
          {createWorkspace.isPending ? 'Creating…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
