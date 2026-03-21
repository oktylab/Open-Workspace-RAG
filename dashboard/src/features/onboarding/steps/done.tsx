import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  onDone: () => void
}

export function DoneStep({ onDone }: Props) {
  return (
    <div className='space-y-8 text-center'>
      <div className='flex justify-center'>
        <div className='flex size-20 items-center justify-center rounded-2xl bg-green-500/10'>
          <CheckCircle2 className='size-10 text-green-500' />
        </div>
      </div>

      <div className='space-y-3'>
        <h1 className='text-3xl font-bold tracking-tight'>You're all set!</h1>
        <p className='text-muted-foreground'>
          Your workspace is ready. Start crawling your website and chatting with your knowledge
          base.
        </p>
      </div>

      <div className='rounded-lg border bg-muted/40 p-4 text-left text-sm space-y-2'>
        <p className='font-medium text-foreground'>Next steps:</p>
        <ul className='space-y-1 text-muted-foreground list-none'>
          <li>
            1. Go to <span className='font-medium text-foreground'>Jobs</span> and create a crawl
            job to index your content
          </li>
          <li>
            2. Once indexed, open{' '}
            <span className='font-medium text-foreground'>Chat</span> to query your knowledge base
          </li>
        </ul>
      </div>

      <Button size='lg' className='w-full' onClick={onDone}>
        Access Dashboard
      </Button>
    </div>
  )
}
