import { type TagNode } from './types'
import type { Tag } from '@/features/tags/data/schema'

export function buildTagTree(tags: string[]): TagNode[] {
  const root: TagNode[] = []
  const nodeMap = new Map<string, TagNode>()
  const sortedTags = [...tags].sort()

  for (const tag of sortedTags) {
    const parts = tag.split('.')
    let currentPath = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const parentPath = currentPath
      currentPath = currentPath ? `${currentPath}.${part}` : part

      if (!nodeMap.has(currentPath)) {
        const newNode: TagNode = {
          name: part,
          fullPath: currentPath,
          label: part,
          children: [],
          parent: parentPath || undefined,
        }
        nodeMap.set(currentPath, newNode)

        if (i === 0) {
          root.push(newNode)
        } else {
          const parent = nodeMap.get(parentPath)
          if (parent) {
            parent.children.push(newNode)
          }
        }
      }
    }
  }

  return root
}

export function buildTagTreeFromObjects(tags: Tag[]): TagNode[] {
  const root: TagNode[] = []
  const nodeMap = new Map<string, TagNode>()
  const sorted = [...tags].sort((a, b) => a.path.localeCompare(b.path))

  for (const tag of sorted) {
    const parts = tag.path.split('.')
    const node: TagNode = {
      id: tag.id,
      name: parts[parts.length - 1],
      fullPath: tag.path,
      label: tag.label,
      description: tag.description,
      children: [],
      parent: parts.length > 1 ? parts.slice(0, -1).join('.') : undefined,
    }
    nodeMap.set(tag.path, node)
    if (parts.length === 1) {
      root.push(node)
    } else {
      const parent = nodeMap.get(parts.slice(0, -1).join('.'))
      if (parent) parent.children.push(node)
      else root.push(node)
    }
  }

  return root
}

export function getAllDescendants(node: TagNode): string[] {
  const descendants: string[] = [node.fullPath]
  for (const child of node.children) {
    descendants.push(...getAllDescendants(child))
  }
  return descendants
}

export function findNode(tree: TagNode[], fullPath: string): TagNode | null {
  for (const node of tree) {
    if (node.fullPath === fullPath) return node
    const found = findNode(node.children, fullPath)
    if (found) return found
  }
  return null
}

export function flattenTree(nodes: TagNode[]): TagNode[] {
  const result: TagNode[] = []
  for (const node of nodes) {
    result.push(node)
    result.push(...flattenTree(node.children))
  }
  return result
}