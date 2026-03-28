import { useState } from 'react'
import { RotateCcw, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  onSend: (query: string) => void
  onReset: () => void
  disabled: boolean
}

export function ChatInput({ onSend, onReset, disabled }: Props) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex w-full flex-none items-stretch gap-2 border-t p-4'>
      <div className='flex flex-1 items-center rounded-md border border-input bg-background px-2 py-1 focus-within:ring-1 focus-within:ring-ring focus-within:outline-hidden'>
        <label className='flex-1'>
          <span className='sr-only'>Chat input</span>
          <input
            type='text'
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Ask a question…'
            className='h-8 w-full bg-inherit text-sm focus-visible:outline-hidden'
            disabled={disabled}
          />
        </label>
        <Button
          type='submit'
          variant='ghost'
          size='icon'
          className='shrink-0'
          disabled={disabled || !value.trim()}
          aria-label='Send message'
        >
          <Send size={16} />
        </Button>
      </div>
      <Button
        type='button'
        variant='outline'
        className='h-full shrink-0 px-3'
        onClick={onReset}
        disabled={disabled}
        aria-label='New conversation'
        title='New conversation'
      >
        <RotateCcw size={16} />
      </Button>
    </form>
  )
}
