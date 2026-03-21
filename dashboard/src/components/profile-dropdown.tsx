import { Link } from '@tanstack/react-router'
import { Building2, Globe, LogOut, Palette } from 'lucide-react'
import useDialogState from '@/hooks/use-dialog-state'
import { useMe } from '@/features/auth/hooks'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOutDialog } from '@/components/sign-out-dialog'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ProfileDropdown() {
  const [open, setOpen] = useDialogState()
  const { data: organization, isLoading } = useMe()

  const initials = isLoading ? '…' : getInitials(organization?.name ?? 'U')

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <Avatar className='h-8 w-8'>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex items-center gap-2'>
              <Avatar className='h-8 w-8'>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className='flex flex-col gap-0.5'>
                <p className='text-sm font-medium leading-none'>
                  {organization?.name ?? 'Loading…'}
                </p>
                <p className='text-xs leading-none text-muted-foreground'>
                  {organization?.email ?? ''}
                </p>
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
          <DropdownMenuItem variant='destructive' onClick={() => setOpen(true)}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
