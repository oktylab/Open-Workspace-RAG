import { useState } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  value: string[]
  onChange: (origins: string[]) => void
}

export function OriginsInput({ value, onChange }: Props) {
  const [input, setInput] = useState('')

  const add = () => {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
  }

  const remove = (origin: string) => onChange(value.filter((o) => o !== origin))

  return (
    <div className='space-y-2'>
      <Label>Allowed Origins</Label>
      <div className='flex gap-2'>
        <Input
          placeholder='https://example.com'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <Button type='button' variant='outline' onClick={add}>
          Add
        </Button>
      </div>
      {value.length > 0 && (
        <div className='flex flex-wrap gap-1.5 pt-1'>
          {value.map((origin) => (
            <Badge key={origin} variant='secondary' className='gap-1 pr-1'>
              {origin}
              <button
                type='button'
                onClick={() => remove(origin)}
                className='ml-0.5 rounded-full hover:text-destructive'
              >
                <X className='size-3' />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <p className='text-xs text-muted-foreground'>
        Origins allowed to use this workspace.
      </p>
    </div>
  )
}
