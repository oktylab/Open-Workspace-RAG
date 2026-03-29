import { Globe, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export type JobCreationType = 'url' | 'pdf'

const JOB_TYPES: {
  type: JobCreationType
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}[] = [
  {
    type: 'url',
    icon: Globe,
    title: 'URL Crawl',
    description: 'Scrape and index content from a website by providing a starting URL.',
  },
  {
    type: 'pdf',
    icon: FileText,
    title: 'PDF Upload',
    description: 'Upload one or more PDF documents for text extraction and indexing.',
  },
]

type JobTypePickerProps = {
  onSelect: (type: JobCreationType) => void
}

export function JobTypePicker({ onSelect }: JobTypePickerProps) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
      {JOB_TYPES.map(({ type, icon: Icon, title, description }) => (
        <button
          key={type}
          type='button'
          onClick={() => onSelect(type)}
          className={cn(
            'flex flex-col items-start gap-4 rounded-lg border p-6 text-left transition-colors',
            'hover:border-primary hover:bg-primary/5',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <div className='rounded-md border bg-muted p-2.5'>
            <Icon className='h-5 w-5' />
          </div>
          <div>
            <p className='font-semibold'>{title}</p>
            <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
