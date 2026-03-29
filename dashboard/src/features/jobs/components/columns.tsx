import { type ColumnDef } from '@tanstack/react-table'
import { Globe, FileText } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { jobStatuses } from '../data/data'
import type { Job } from '../data/schema'
import { JobsRowActions } from './row-actions'

export const jobsColumns: ColumnDef<Job>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    meta: { className: 'w-[80px]' },
    cell: ({ row }) => {
      const type = row.original.config?.type
      if (!type) return <span className='text-muted-foreground text-xs'>—</span>
      return (
        <Badge variant='outline' className='gap-1 text-xs font-normal'>
          {type === 'url'
            ? <Globe className='h-3 w-3' />
            : <FileText className='h-3 w-3' />}
          {type === 'url' ? 'URL' : 'PDF'}
        </Badge>
      )
    },
    enableSorting: false,
  },
  {
    id: 'source',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Source' />
    ),
    meta: {
      className: 'ps-1 w-1/2 max-w-[300px]',
      tdClassName: 'ps-4',
    },
    cell: ({ row }) => {
      const config = row.original.config
      if (!config) return <span className='text-muted-foreground'>—</span>

      if (config.type === 'url') {
        return (
          <a
            href={config.url}
            target='_blank'
            rel='noopener noreferrer'
            className='block truncate font-medium hover:underline'
            onClick={(e) => e.stopPropagation()}
          >
            {config.url}
          </a>
        )
      }

      return (
        <span className='text-sm text-muted-foreground'>
          {config.storage_keys.length} file{config.storage_keys.length !== 1 ? 's' : ''}
        </span>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    meta: { className: 'ps-1', tdClassName: 'ps-4' },
    cell: ({ row }) => {
      const status = jobStatuses.find((s) => s.value === row.getValue('status'))
      if (!status) return null
      return (
        <div className='flex w-[100px] items-center gap-2'>
          {status.icon && (
            <status.icon className='size-4 text-muted-foreground' />
          )}
          <span>{status.label}</span>
        </div>
      )
    },
    filterFn: () => true,
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'))
      return (
        <div className='w-[140px] text-sm'>
          {date.toLocaleDateString()}{' '}
          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <JobsRowActions row={row} />,
  },
]
