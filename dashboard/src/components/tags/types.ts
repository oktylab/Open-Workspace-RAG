export interface TagNode {
  id?: string
  name: string
  fullPath: string
  label: string
  description?: string | null
  children: TagNode[]
  parent?: string
}

export type SelectionMode = 'single' | 'multiple'

export interface TagSelection {
  selected: Set<string>
  mode: SelectionMode
}
