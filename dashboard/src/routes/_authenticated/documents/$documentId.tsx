/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Tag,
  Clock,
  Layers,
  Info,
  ExternalLink,
  FileText,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Check,
  X,
  Pencil,
} from 'lucide-react'
import { useState } from 'react'
import { useDocument, useUpdateDocument } from '@/features/documents/hooks'
import { useWorkspaceTags } from '@/features/tags/hooks/use-workspace-tags'
import { buildTagTreeFromObjects } from '@/components/tags'
import type { TagNode } from '@/components/tags'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { Markdown } from '@/components/ui/markdown'
import type { Tag as TagType } from '@/features/tags/data/schema'

export const Route = createFileRoute('/_authenticated/documents/$documentId')({
  component: DocumentDetail,
})

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-3 border-b border-border/50 last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-right text-foreground">{value}</span>
    </div>
  )
}

function DocumentContentSection({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-1 flex-col h-full'>
      <div className='flex-none'>
        <h3 className='text-lg font-medium'>{title}</h3>
        <p className='text-sm text-muted-foreground'>{desc}</p>
      </div>
      <Separator className='my-4 flex-none' />
      <div className='h-full w-full overflow-y-auto scroll-smooth pe-4 pb-12'>
        <div className='-mx-1 px-1.5 lg:max-w-4xl'>{children}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Title Dialog
// ─────────────────────────────────────────────────────────────────────────────
function EditTitleDialog({
  open,
  currentTitle,
  documentId,
  onClose,
}: {
  open: boolean
  currentTitle: string
  documentId: string
  onClose: () => void
}) {
  const [value, setValue] = React.useState(currentTitle)
  const updateDoc = useUpdateDocument(documentId)

  React.useEffect(() => {
    if (open) setValue(currentTitle)
  }, [open, currentTitle])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    updateDoc.mutate(
      { title: value.trim() },
      { onSuccess: onClose }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit title</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Document title"
            autoFocus
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!value.trim() || updateDoc.isPending}>
              {updateDoc.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tag Tree Picker (inline, single select, highlights current tag)
// ─────────────────────────────────────────────────────────────────────────────
interface TagPickerNodeProps {
  node: TagNode
  depth: number
  expanded: Set<string>
  selectedPath: string | null
  onToggleExpand: (path: string) => void
  onSelect: (node: TagNode) => void
}

function TagPickerNode({ node, depth, expanded, selectedPath, onToggleExpand, onSelect }: TagPickerNodeProps) {
  const isExpanded = expanded.has(node.fullPath)
  const hasChildren = node.children.length > 0
  const isSelected = node.fullPath === selectedPath

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1.5 rounded-sm px-2 py-1.5 cursor-pointer transition-colors',
          isSelected
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-muted/60'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        <button
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center',
            !hasChildren && 'invisible'
          )}
          onClick={(e) => { e.stopPropagation(); onToggleExpand(node.fullPath) }}
        >
          {isExpanded
            ? <ChevronDown size={12} className="text-muted-foreground" />
            : <ChevronRight size={12} className="text-muted-foreground" />
          }
        </button>

        {hasChildren ? (
          isExpanded
            ? <FolderOpen size={14} className={cn('shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
            : <Folder size={14} className={cn('shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
        ) : (
          <Tag size={13} className={cn('shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
        )}

        <span className="text-sm font-medium flex-1 truncate">{node.label}</span>

        {isSelected && <Check size={13} className="shrink-0 text-primary" />}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TagPickerNode
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selectedPath={selectedPath}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface TagSectionProps {
  documentId: string
  currentTag: string | null | undefined
  currentTagId: string | null | undefined
  allTags: TagType[]
}

function TagSection({ documentId, currentTag, currentTagId, allTags }: TagSectionProps) {
  const updateDoc = useUpdateDocument(documentId)
  const tree = React.useMemo(() => buildTagTreeFromObjects(allTags), [allTags])

  const [expanded, setExpanded] = React.useState<Set<string>>(() => {
    const all = new Set<string>()
    const collect = (nodes: TagNode[]) => {
      for (const n of nodes) {
        if (n.children.length > 0) { all.add(n.fullPath); collect(n.children) }
      }
    }
    collect(tree)
    return all
  })

  // Track pending selection
  const [pendingTagId, setPendingTagId] = React.useState<string | null | undefined>(undefined)
  const effectiveTagId = pendingTagId !== undefined ? pendingTagId : currentTagId
  const effectiveTagPath = pendingTagId !== undefined
    ? allTags.find((t) => t.id === pendingTagId)?.path ?? null
    : currentTag ?? null

  const isDirty = pendingTagId !== undefined && pendingTagId !== currentTagId

  const toggleExpand = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  const handleSelect = (node: TagNode) => {
    const tag = allTags.find((t) => t.id === node.id)
    if (!tag) return
    // Clicking the already-selected tag deselects
    setPendingTagId(tag.id === effectiveTagId ? null : tag.id)
  }

  const handleSave = () => {
    updateDoc.mutate(
      { tag_id: pendingTagId ?? null },
      { onSuccess: () => setPendingTagId(undefined) }
    )
  }

  const handleCancel = () => setPendingTagId(undefined)

  if (allTags.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/30 p-4 text-center">
        <Tag className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No tags available in this workspace</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {effectiveTagPath ? (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">{effectiveTagPath}</Badge>
          {isDirty && <span className="text-xs text-muted-foreground">unsaved</span>}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No tag assigned — click one to assign</p>
      )}

      <div className="rounded-md border bg-card py-1 max-h-64 overflow-y-auto">
        {tree.map((node) => (
          <TagPickerNode
            key={node.fullPath}
            node={node}
            depth={0}
            expanded={expanded}
            selectedPath={effectiveTagPath}
            onToggleExpand={toggleExpand}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {isDirty && (
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={updateDoc.isPending}>
            <Check className="mr-1.5 h-3.5 w-3.5" />
            {updateDoc.isPending ? 'Saving...' : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="mr-1.5 h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
function DocumentDetail() {
  const { documentId } = Route.useParams()
  const navigate = useNavigate()
  const { data: document, isLoading } = useDocument(documentId)
  const { tags: allTags } = useWorkspaceTags()
  const [activeTab, setActiveTab] = useState('overview')
  const [editTitleOpen, setEditTitleOpen] = useState(false)

  const sidebarNavItems = [
    { id: 'overview', title: 'Overview', icon: <FileText size={18} /> },
    { id: 'chunks', title: 'Chunks', icon: <Layers size={18} /> },
  ]

  if (isLoading) {
    return (
      <>
        <Header>
          <Search />
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main fixed>
          <div className='space-y-4'>
            <Skeleton className='h-8 w-32' />
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-64 w-full' />
          </div>
        </Main>
      </>
    )
  }

  if (!document) {
    return (
      <>
        <Header>
          <Search />
          <div className='ms-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </Header>
        <Main fixed>
          <div className='flex flex-1 items-center justify-center'>
            <div className='text-destructive'>Document not found</div>
          </div>
        </Main>
      </>
    )
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <div className='flex items-center gap-2 mb-2'>
            <Button
              variant='ghost'
              size='sm'
              className='gap-1 -ml-3'
              onClick={() => navigate({ to: '/documents', search: {} as Record<string, never> })}
            >
              <ArrowLeft className='h-4 w-4' />
              Back to Documents
            </Button>
          </div>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='max-w-4xl min-w-0'>
              <div className='flex items-center gap-2 group'>
                <h1 className='text-2xl font-bold tracking-tight md:text-3xl truncate'>
                  {document.title || 'Untitled Document'}
                </h1>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity'
                  onClick={() => setEditTitleOpen(true)}
                >
                  <Pencil className='h-3.5 w-3.5' />
                </Button>
              </div>
              <a
                href={document.url}
                target='_blank'
                rel='noopener noreferrer'
                className='text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-1 mt-1 truncate'
              >
                {document.url}
                <ExternalLink className='h-3.5 w-3.5 shrink-0' />
              </a>
            </div>
            <div className='flex gap-2 shrink-0'>
              <Badge
                variant='outline'
                className={cn(
                  'gap-1 h-6',
                  document.is_approved
                    ? 'bg-primary/5 text-primary border-primary/20'
                    : 'bg-destructive/5 text-destructive border-destructive/20'
                )}
              >
                {document.is_approved ? 'Approved' : 'Not Approved'}
              </Badge>
            </div>
          </div>
        </div>

        <Separator className='my-4 lg:my-6' />

        <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <aside className='top-0 lg:sticky lg:w-1/5'>
            <div className='p-1 md:hidden'>
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className='h-12 w-full'>
                  <SelectValue placeholder='Select Tab' />
                </SelectTrigger>
                <SelectContent>
                  {sidebarNavItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className='flex gap-x-4 px-2 py-1'>
                        <span className='scale-125'>{item.icon}</span>
                        <span className='text-md'>{item.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea
              orientation='horizontal'
              type='always'
              className='hidden w-full min-w-40 bg-background px-1 py-2 md:block'
            >
              <nav className='flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0'>
                {sidebarNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      buttonVariants({ variant: 'ghost' }),
                      activeTab === item.id
                        ? 'bg-muted hover:bg-muted'
                        : 'hover:bg-transparent hover:underline',
                      'justify-start'
                    )}
                  >
                    <span className='me-2'>{item.icon}</span>
                    {item.title}
                  </button>
                ))}
              </nav>
            </ScrollArea>
          </aside>

          <div className='flex w-full overflow-hidden p-1 pr-4'>
            <div className='w-full h-full'>
              {activeTab === 'overview' && (
                <DocumentContentSection title='Overview' desc='Document details and metadata'>
                  <div className='space-y-8'>
                    <div>
                      <h4 className='font-medium mb-3 text-sm text-muted-foreground flex items-center gap-2'>
                        <Info className="h-4 w-4" /> Basic Information
                      </h4>
                      <div className='rounded-md border bg-card px-4'>
                        <DataRow label="Language" value={<Badge variant='secondary' className='font-mono uppercase'>{document.lang}</Badge>} />
                        <DataRow label="Status" value={document.is_approved ? 'Approved' : 'Review Required'} />
                        <DataRow label="Chunks Count" value={document.chunks.length.toString()} />
                      </div>
                    </div>

                    <div>
                      <h4 className='font-medium mb-3 text-sm text-muted-foreground flex items-center gap-2'>
                        <Clock className="h-4 w-4" /> Timestamps
                      </h4>
                      <div className='rounded-md border bg-card px-4'>
                        <DataRow label="Created" value={new Date(document.created_at).toLocaleString()} />
                        <DataRow label="Last Updated" value={new Date(document.updated_at).toLocaleString()} />
                      </div>
                    </div>

                    <div>
                      <h4 className='font-medium mb-3 text-sm text-muted-foreground flex items-center gap-2'>
                        <Tag className="h-4 w-4" /> Tag
                      </h4>
                      <TagSection
                        documentId={documentId}
                        currentTag={document.tag}
                        currentTagId={document.tag_id}
                        allTags={allTags}
                      />
                    </div>
                  </div>
                </DocumentContentSection>
              )}

              {activeTab === 'chunks' && (
                <DocumentContentSection title='Chunks' desc='Extracted content parts for vector search'>
                  <div className='space-y-4 pb-4'>
                    <Accordion type='single' collapsible className='w-full border rounded-lg bg-card overflow-hidden'>
                      {document.chunks.map((chunk, index) => (
                        <AccordionItem key={chunk.id} value={chunk.id} className='border-b last:border-0 px-4'>
                          <AccordionTrigger className='hover:no-underline py-4'>
                            <div className='flex items-center gap-3 text-left'>
                              <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold'>
                                {index + 1}
                              </span>
                              <div className='flex flex-col min-w-0'>
                                <span className='text-sm font-medium line-clamp-1'>
                                  {chunk.content.substring(0, 100)}...
                                </span>
                                <span className='text-[10px] font-mono text-muted-foreground mt-0.5'>
                                  ID: {chunk.id.substring(0, 8)}...
                                </span>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className='pb-6 pt-2'>
                            <Markdown className='prose prose-sm dark:prose-invert max-w-none rounded-md bg-muted/50 p-4 text-sm leading-relaxed'>
                              {chunk.content}
                            </Markdown>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                      {document.chunks.length === 0 && (
                        <div className='text-center py-12 text-muted-foreground'>
                          No chunks found for this document.
                        </div>
                      )}
                    </Accordion>
                  </div>
                </DocumentContentSection>
              )}
            </div>
          </div>
        </div>
      </Main>

      <EditTitleDialog
        open={editTitleOpen}
        currentTitle={document.title ?? ''}
        documentId={documentId}
        onClose={() => setEditTitleOpen(false)}
      />
    </>
  )
}
