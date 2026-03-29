import * as React from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Tag,
  Plus,
  Pencil,
  Trash2,
  Tags,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildTagTreeFromObjects } from '@/components/tags'
import type { TagNode } from '@/components/tags'
import { useWorkspaceTags } from './hooks/use-workspace-tags'
import type { Tag as TagType } from './data/schema'

// ────────────────────────────────────────────────────────────────────────────
// Path slug helper
// ────────────────────────────────────────────────────────────────────────────
function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// ────────────────────────────────────────────────────────────────────────────
// Add Tag Dialog
// ────────────────────────────────────────────────────────────────────────────
interface AddDialogProps {
  open: boolean
  parentPath?: string
  onClose: () => void
  onSubmit: (path: string, label: string, description?: string) => void
  isPending: boolean
}

function AddTagDialog({ open, parentPath, onClose, onSubmit, isPending }: AddDialogProps) {
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')

  const slug = toSlug(name)
  const fullPath = parentPath ? `${parentPath}.${slug}` : slug

  React.useEffect(() => {
    if (!open) {
      setName('')
      setDescription('')
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!slug) return
    onSubmit(fullPath, name.trim(), description.trim() || undefined)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{parentPath ? 'Add Child Tag' : 'Add Root Tag'}</DialogTitle>
          {parentPath && (
            <DialogDescription>
              Adding under <span className="font-mono text-foreground">{parentPath}</span>
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Label</Label>
            <Input
              id="tag-name"
              placeholder="e.g. Quantum Physics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          {slug && (
            <div className="rounded-md bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">Path: </span>
              <span className="font-mono">{fullPath}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="tag-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="tag-desc"
              placeholder="What this tag is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!slug || isPending}>
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Edit Tag Dialog
// ────────────────────────────────────────────────────────────────────────────
interface EditDialogProps {
  open: boolean
  tag?: TagType
  onClose: () => void
  onSubmit: (label: string, description?: string | null) => void
  isPending: boolean
}

function EditTagDialog({ open, tag, onClose, onSubmit, isPending }: EditDialogProps) {
  const [label, setLabel] = React.useState('')
  const [description, setDescription] = React.useState('')

  React.useEffect(() => {
    if (open && tag) {
      setLabel(tag.label)
      setDescription(tag.description ?? '')
    }
  }, [open, tag])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return
    onSubmit(label.trim(), description.trim() || null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Tag</DialogTitle>
          <DialogDescription>
            <span className="font-mono text-foreground">{tag?.path}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-label">Label</Label>
            <Input
              id="edit-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What this tag is about..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!label.trim() || isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Tree Node Row
// ────────────────────────────────────────────────────────────────────────────
interface TreeRowProps {
  node: TagNode
  depth: number
  expanded: Set<string>
  onToggle: (path: string) => void
  onAdd: (parentPath: string) => void
  onEdit: (node: TagNode) => void
  onDelete: (node: TagNode) => void
}

function TreeRow({ node, depth, expanded, onToggle, onAdd, onEdit, onDelete }: TreeRowProps) {
  const isExpanded = expanded.has(node.fullPath)
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1.5 rounded-sm px-2 py-1.5 transition-colors',
          'hover:bg-muted/60'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Expand chevron */}
        <button
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground',
            !hasChildren && 'invisible'
          )}
          onClick={() => onToggle(node.fullPath)}
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* Folder / tag icon */}
        <button
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
          onClick={() => hasChildren && onToggle(node.fullPath)}
        >
          {hasChildren ? (
            isExpanded
              ? <FolderOpen size={15} className="shrink-0 text-primary" />
              : <Folder size={15} className="shrink-0 text-muted-foreground" />
          ) : (
            <Tag size={14} className="shrink-0 text-muted-foreground" />
          )}
          <span className="text-sm font-medium truncate">{node.label}</span>
          {node.description && (
            <span className="text-xs text-muted-foreground truncate hidden lg:block">
              — {node.description}
            </span>
          )}
        </button>

        {/* Actions (visible on hover) */}
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onAdd(node.fullPath)}
                >
                  <Plus size={12} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add child</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onEdit(node)}
                >
                  <Pencil size={12} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(node)}
                >
                  <Trash2 size={12} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeRow
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Main View
// ────────────────────────────────────────────────────────────────────────────
export function TagsView() {
  const { tags, isLoading, addTag, updateTag, deleteTag } = useWorkspaceTags()

  const tree = React.useMemo(() => buildTagTreeFromObjects(tags), [tags])

  // All nodes expanded by default
  const [expanded, setExpanded] = React.useState<Set<string>>(() => {
    const all = new Set<string>()
    const collect = (nodes: TagNode[]) => {
      for (const n of nodes) {
        if (n.children.length > 0) {
          all.add(n.fullPath)
          collect(n.children)
        }
      }
    }
    collect(tree)
    return all
  })

  // Sync expanded when tree changes (new nodes expand by default)
  React.useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev)
      const collect = (nodes: TagNode[]) => {
        for (const n of nodes) {
          if (n.children.length > 0) {
            next.add(n.fullPath)
            collect(n.children)
          }
        }
      }
      collect(tree)
      return next
    })
  }, [tree])

  const toggleExpand = React.useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }, [])

  // Dialogs state
  const [addDialog, setAddDialog] = React.useState<{ open: boolean; parentPath?: string }>({ open: false })
  const [editDialog, setEditDialog] = React.useState<{ open: boolean; tag?: TagType }>({ open: false })
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; node?: TagNode }>({ open: false })

  const handleAdd = (path: string, label: string, description?: string) => {
    addTag.mutate(
      { path, label, description },
      { onSuccess: () => setAddDialog({ open: false }) }
    )
  }

  const handleEdit = (label: string, description?: string | null) => {
    if (!editDialog.tag) return
    updateTag.mutate(
      { path: editDialog.tag.path, payload: { label, description: description ?? undefined } },
      { onSuccess: () => setEditDialog({ open: false }) }
    )
  }

  const handleDelete = () => {
    if (!deleteDialog.node) return
    deleteTag.mutate(deleteDialog.node.fullPath, {
      onSuccess: () => setDeleteDialog({ open: false }),
    })
  }

  // Find Tag object from node for edit
  const findTag = (node: TagNode): TagType | undefined =>
    tags.find((t) => t.id === node.id)

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your knowledge base with hierarchical tags
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-sm" style={{ marginLeft: `${(i % 3) * 16}px`, width: `calc(100% - ${(i % 3) * 16}px)` }} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card py-1">
            {tags.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Tags className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No tags yet</p>
              </div>
            ) : (
              tree.map((node) => (
                <TreeRow
                  key={node.fullPath}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  onToggle={toggleExpand}
                  onAdd={(parentPath) => setAddDialog({ open: true, parentPath })}
                  onEdit={(n) => {
                    const tag = findTag(n)
                    if (tag) setEditDialog({ open: true, tag })
                  }}
                  onDelete={(n) => setDeleteDialog({ open: true, node: n })}
                />
              ))
            )}
            <button
              className="group flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-muted-foreground/50 transition-colors hover:bg-muted/60 hover:text-muted-foreground"
              onClick={() => setAddDialog({ open: true })}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center invisible" />
              <Plus size={13} className="shrink-0" />
              <span className="text-xs">Add root tag</span>
            </button>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Badge variant="secondary">{tags.length} tag{tags.length !== 1 ? 's' : ''}</Badge>
        </div>
      </Main>

      {/* Add Dialog */}
      <AddTagDialog
        open={addDialog.open}
        parentPath={addDialog.parentPath}
        onClose={() => setAddDialog({ open: false })}
        onSubmit={handleAdd}
        isPending={addTag.isPending}
      />

      {/* Edit Dialog */}
      <EditTagDialog
        open={editDialog.open}
        tag={editDialog.tag}
        onClose={() => setEditDialog({ open: false })}
        onSubmit={handleEdit}
        isPending={updateTag.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(v) => !v && setDeleteDialog({ open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tag?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete{' '}
              <span className="font-mono font-medium text-foreground">{deleteDialog.node?.label}</span>
              {deleteDialog.node && deleteDialog.node.children.length > 0 && (
                <> and all {deleteDialog.node.children.length} child tag(s)</>
              )}
              . Documents will lose their tag assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTag.isPending}
            >
              {deleteTag.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
