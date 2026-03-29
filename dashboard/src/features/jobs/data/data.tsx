import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Cpu,
  Filter,
  LayoutTemplate,
  Globe,
  FileText,
} from 'lucide-react'
import type { JobStatusValue } from './schema'

export const jobStatuses: {
  label: string
  value: JobStatusValue
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    label: 'Pending',
    value: 'PENDING',
    icon: Clock,
  },
  {
    label: 'Running',
    value: 'STARTED',
    icon: Loader2,
  },
  {
    label: 'Success',
    value: 'SUCCESS',
    icon: CheckCircle,
  },
  {
    label: 'Failed',
    value: 'FAILURE',
    icon: XCircle,
  },
]

export const filterTypes: {
  label: string
  value: 'url' | 'domain' | 'seo' | 'relevance'
  description: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    label: 'URL Pattern',
    value: 'url',
    description: 'Include/exclude URLs matching patterns',
    icon: Cpu,
  },
  {
    label: 'Domain',
    value: 'domain',
    description: 'Allow or block specific domains',
    icon: Filter,
  },
  {
    label: 'SEO Keywords',
    value: 'seo',
    description: 'Filter by SEO keyword relevance',
    icon: AlertCircle,
  },
  {
    label: 'Relevance Query',
    value: 'relevance',
    description: 'Filter by semantic relevance to a query',
    icon: LayoutTemplate,
  },
]

export const languages: {
  label: string
  value: 'AR' | 'FR' | 'EN'
}[] = [
  { label: 'Arabic', value: 'AR' },
  { label: 'French', value: 'FR' },
  { label: 'English', value: 'EN' },
]

export const jobTypes: {
  label: string
  value: 'url' | 'pdf'
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { label: 'URL', value: 'url', icon: Globe },
  { label: 'PDF', value: 'pdf', icon: FileText },
]
