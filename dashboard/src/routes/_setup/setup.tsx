import { createFileRoute } from '@tanstack/react-router'
import { Onboarding } from '@/features/onboarding'

export const Route = createFileRoute('/_setup/setup')({
  component: Onboarding,
})
