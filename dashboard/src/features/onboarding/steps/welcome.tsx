import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  orgName?: string
  onNext: () => void
}

export function WelcomeStep({ orgName, onNext }: Props) {
  return (
    <div className='space-y-8 text-center'>
      <div className='flex justify-center'>
        <div className='flex size-20 items-center justify-center rounded-2xl bg-primary/10'>
          <Sparkles className='size-10 text-primary' />
        </div>
      </div>

      <div className='space-y-3'>
        <h1 className='text-3xl font-bold tracking-tight'>
          Welcome{orgName ? `, ${orgName}` : ''}!
        </h1>
        <p className='text-muted-foreground'>
          Let's get your knowledge base up and running. We'll set up your first workspace in just a
          couple of steps.
        </p>
      </div>

      <div className='rounded-lg border bg-muted/40 p-4 text-left text-sm text-muted-foreground space-y-2'>
        <p className='font-medium text-foreground'>A workspace lets you:</p>
        <ul className='space-y-1 list-none'>
          <li>• Crawl and index documents from your website</li>
          <li>• Run RAG-powered chat against your knowledge base</li>
          <li>• Control access with a dedicated API key</li>
        </ul>
      </div>

      <Button size='lg' className='w-full' onClick={onNext}>
        Get Started
        <ArrowRight className='ml-2 size-4' />
      </Button>
    </div>
  )
}
