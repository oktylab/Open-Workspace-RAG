import { useState, useRef } from 'react'
import { FileText, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PdfJobFormProps = {
  onSubmit: (files: File[]) => Promise<void>
  isPending?: boolean
}

export function PdfJobForm({ onSubmit, isPending }: PdfJobFormProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const pdfs = Array.from(incoming).filter((f) => f.type === 'application/pdf')
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name))
      return [...prev, ...pdfs.filter((f) => !existing.has(f.name))]
    })
  }

  const removeFile = (name: string) =>
    setFiles((prev) => prev.filter((f) => f.name !== name))

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files.length || isPending) return
    await onSubmit(files)
  }

  const totalSize = files.reduce((acc, f) => acc + f.size, 0)
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
      {/* Drop zone */}
      <div
        role='button'
        tabIndex={0}
        className={cn(
          'rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/60 hover:bg-muted/30',
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <Upload className='mx-auto h-8 w-8 text-muted-foreground mb-3' />
        <p className='text-sm font-medium'>Drop PDF files here or click to browse</p>
        <p className='text-xs text-muted-foreground mt-1'>Only PDF files · Multiple files supported</p>
        <input
          ref={inputRef}
          type='file'
          accept='application/pdf'
          multiple
          className='hidden'
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <p className='text-sm font-medium text-muted-foreground'>
              {files.length} file{files.length !== 1 ? 's' : ''} · {formatSize(totalSize)}
            </p>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='h-7 text-xs text-muted-foreground'
              onClick={() => setFiles([])}
            >
              Clear all
            </Button>
          </div>
          <div className='space-y-1.5'>
            {files.map((file) => (
              <div
                key={file.name}
                className='flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2'
              >
                <div className='flex items-center gap-2 min-w-0'>
                  <FileText className='h-4 w-4 shrink-0 text-muted-foreground' />
                  <span className='text-sm truncate'>{file.name}</span>
                  <span className='text-xs text-muted-foreground shrink-0'>
                    {formatSize(file.size)}
                  </span>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6 shrink-0'
                  onClick={(e) => { e.stopPropagation(); removeFile(file.name) }}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='mt-auto flex justify-end border-t pt-4'>
        <Button
          type='submit'
          disabled={isPending || files.length === 0}
          className='gap-2'
        >
          <Upload className='h-4 w-4' />
          {isPending ? 'Uploading...' : `Upload & Process${files.length > 0 ? ` (${files.length})` : ''}`}
        </Button>
      </div>
    </form>
  )
}
