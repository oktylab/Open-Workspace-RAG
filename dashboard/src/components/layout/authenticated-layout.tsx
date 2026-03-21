import { useEffect } from 'react'
import { Outlet, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { useWorkspaces } from '@/features/auth/hooks'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { AuthGuard } from '@/components/auth/auth-guard'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { data: workspaces } = useWorkspaces()

  const isLoading = workspaces === undefined
  const hasWorkspaces = workspaces && workspaces.length > 0

  useEffect(() => {
    if (!isLoading && !hasWorkspaces) {
      void navigate({ to: '/setup' })
    }
  }, [isLoading, hasWorkspaces, navigate])

  if (isLoading) {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <Loader2 className='size-6 animate-spin text-muted-foreground' />
      </div>
    )
  }

  if (!hasWorkspaces) return null

  return <>{children}</>
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  return (
    <AuthGuard>
      <WorkspaceGuard>
        <SearchProvider>
          <LayoutProvider>
            <SidebarProvider defaultOpen={defaultOpen}>
              <SkipToMain />
              <AppSidebar />
              <SidebarInset
                className={cn(
                  '@container/content',
                  'has-data-[layout=fixed]:h-svh',
                  'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
                )}
              >
                {children ?? <Outlet />}
              </SidebarInset>
            </SidebarProvider>
          </LayoutProvider>
        </SearchProvider>
      </WorkspaceGuard>
    </AuthGuard>
  )
}
