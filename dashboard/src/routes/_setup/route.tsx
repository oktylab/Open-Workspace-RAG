import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'

function SetupLayout() {
  return <Outlet />
}

export const Route = createFileRoute('/_setup')({
  beforeLoad: () => {
    const accessToken = getCookie('access_token')
    if (!accessToken) {
      throw redirect({ to: '/sign-in' })
    }
  },
  component: SetupLayout,
})
