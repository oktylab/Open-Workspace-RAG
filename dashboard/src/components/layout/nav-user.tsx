import { Link } from '@tanstack/react-router'
import {
  ChevronsUpDown,
  LogOut,
  Building2,
  Palette,
  Globe,
} from 'lucide-react'
import useDialogState from '@/hooks/use-dialog-state'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { SignOutDialog } from '@/components/sign-out-dialog'
import { useMe } from '@/features/auth/hooks'

export function NavUser() {
  const { isMobile } = useSidebar()
  const [open, setOpen] = useDialogState()
  const { data: organization, isLoading } = useMe()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <Avatar className='h-8 w-8 rounded-lg'>
                  <AvatarFallback className='rounded-lg'>
                    {isLoading ? '...' : getInitials(organization?.name ?? 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-start text-sm leading-tight'>
                  <span className='truncate font-semibold'>
                    {organization?.name ?? 'Loading...'}
                  </span>
                  <span className='truncate text-xs'>
                    {organization?.email ?? ''}
                  </span>
                </div>
                <ChevronsUpDown className='ms-auto size-4' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              side={isMobile ? 'bottom' : 'right'}
              align='end'
              sideOffset={4}
            >
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-start text-sm'>
                  <Avatar className='h-8 w-8 rounded-lg'>
                    <AvatarFallback className='rounded-lg'>
                      {isLoading ? '...' : getInitials(organization?.name ?? 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-start text-sm leading-tight'>
                    <span className='truncate font-semibold'>
                      {organization?.name ?? 'Loading...'}
                    </span>
                    <span className='truncate text-xs'>
                      {organization?.email ?? ''}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link to='/settings/account'>
                    <Building2 />
                    Organization
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/settings/workspaces'>
                    <Globe />
                    Workspaces
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/settings/appearance'>
                    <Palette />
                    Appearance
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant='destructive'
                onClick={() => setOpen(true)}
              >
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
