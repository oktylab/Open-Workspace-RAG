'use client'

import * as React from 'react'
import { ChevronRight, ChevronDown, Tag, Folder, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type TagNode } from './types'
import { buildTagTree } from './tag-tree'

interface TagTreeProps {
  tags: string[]
  className?: string
  defaultExpandedPaths?: string[]
  renderNode?: (props: {
    node: TagNode
    depth: number
    isExpanded: boolean
    hasChildren: boolean
    onToggleExpand: () => void
  }) => React.ReactNode
}

interface TreeNodeItemProps {
  node: TagNode
  depth: number
  expanded: Set<string>
  onToggleExpand: (path: string) => void
  renderNode?: TagTreeProps['renderNode']
}

function DefaultNode({
  node,
  depth,
  isExpanded,
  hasChildren,
  onToggleExpand,
}: {
  node: TagNode
  depth: number
  isExpanded: boolean
  hasChildren: boolean
  onToggleExpand: () => void
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 py-1.5 px-2 rounded-sm transition-colors',
        hasChildren && 'cursor-pointer hover:bg-muted/60',
        !hasChildren && 'pl-[26px]'
      )}
      style={{ paddingLeft: hasChildren ? `${depth * 12 + 8}px` : `${depth * 12 + 26}px` }}
      onClick={hasChildren ? onToggleExpand : undefined}
    >
      {hasChildren ? (
        <span className="flex items-center justify-center text-muted-foreground">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      ) : null}
      {hasChildren ? (
        isExpanded ? (
          <FolderOpen size={14} className="text-primary" />
        ) : (
          <Folder size={14} className="text-muted-foreground" />
        )
      ) : (
        <Tag size={14} className="text-muted-foreground" />
      )}
      <span className="text-sm font-medium">{node.label || node.name}</span>
    </div>
  )
}

function TreeNodeItem({
  node,
  depth,
  expanded,
  onToggleExpand,
  renderNode,
}: TreeNodeItemProps) {
  const isExpanded = expanded.has(node.fullPath)
  const hasChildren = node.children.length > 0

  const handleToggle = React.useCallback(() => {
    onToggleExpand(node.fullPath)
  }, [node.fullPath, onToggleExpand])

  return (
    <div className="select-none">
      {renderNode ? (
        renderNode({
          node,
          depth,
          isExpanded,
          hasChildren,
          onToggleExpand: handleToggle,
        })
      ) : (
        <DefaultNode
          node={node}
          depth={depth}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onToggleExpand={handleToggle}
        />
      )}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map(child => (
            <TreeNodeItem
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              renderNode={renderNode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function TagTree({ tags, className, defaultExpandedPaths, renderNode }: TagTreeProps) {
    const [expanded, setExpanded] = React.useState<Set<string>>(() => {
    if (defaultExpandedPaths?.length) {
      const toExpand = new Set<string>()
      for (const path of defaultExpandedPaths) {
        const parts = path.split('.')
        let current = ''
        for (let i = 0; i < parts.length - 1; i++) {
          current = current ? `${current}.${parts[i]}` : parts[i]
          toExpand.add(current)
        }
      }
      return toExpand
    }
    
    // Default: expand all
    const allPaths = new Set<string>()
    const addPaths = (nodes: TagNode[]) => {
      for (const node of nodes) {
        if (node.children.length > 0) {
          allPaths.add(node.fullPath)
          addPaths(node.children)
        }
      }
    }
    addPaths(buildTagTree(tags))
    return allPaths
  })

  const tree = React.useMemo(() => buildTagTree(tags), [tags])

  const handleToggleExpand = React.useCallback((path: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  return (
    <div className={cn(className)}>
      {tree.map(node => (
        <TreeNodeItem
          key={node.fullPath}
          node={node}
          depth={0}
          expanded={expanded}
          onToggleExpand={handleToggleExpand}
          renderNode={renderNode}
        />
      ))}
    </div>
  )
}