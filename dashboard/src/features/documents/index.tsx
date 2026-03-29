import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { DocumentsDialogs } from './components/documents-dialogs'
import { DocumentsTable } from './components/documents-table'
import { useDocuments } from './hooks'
import { getRouteApi } from '@tanstack/react-router'
import type { Language } from './data/schema'

const route = getRouteApi('/_authenticated/documents/')

export default function Documents() {
  const search = route.useSearch()
  
  const { data, isLoading } = useDocuments({
    skip: ((search.page ?? 1) - 1) * (search.pageSize ?? 10),
    limit: search.pageSize ?? 10,
    is_approved: search.is_approved?.includes('true') ? true : search.is_approved?.includes('false') ? false : undefined,
    langs: search.lang as Language[] | undefined,
    job_ids: search.job_ids,
    q: search.q,
  })

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Documents</h2>
          <p className='text-muted-foreground'>
            Manage and view your indexed documents and their chunks.
          </p>
        </div>
        {isLoading ? (
          <div className='flex flex-1 items-center justify-center'>
            <div className='text-muted-foreground'>Loading documents...</div>
          </div>
        ) : (
          <DocumentsTable 
            data={data?.items ?? []} 
            total={data?.total ?? 0} 
            languageCounts={data?.language_counts}
          />
        )}
      </Main>

      <DocumentsDialogs />
    </>
  )
}
