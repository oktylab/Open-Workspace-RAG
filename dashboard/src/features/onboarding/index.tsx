import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMe, useWorkspaces } from '@/features/auth/hooks'
import { WelcomeStep } from './steps/welcome'
import { CreateWorkspaceStep } from './steps/create-workspace'
import { DoneStep } from './steps/done'

const TOTAL_STEPS = 3

function StepDots({ current }: { current: number }) {
  return (
    <div className='flex justify-center gap-2'>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}

export function Onboarding() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const { data: organization } = useMe()
  const { data: workspaces } = useWorkspaces()

  // If the user already has workspaces (e.g. navigated here manually), send them home
  useEffect(() => {
    if (workspaces && workspaces.length > 0 && step === 0) {
      void navigate({ to: '/' })
    }
  }, [workspaces, step, navigate])

  return (
    <div className='flex min-h-svh flex-col items-center justify-center bg-background p-6'>
      <div className='w-full max-w-md space-y-8'>
        {/* Logo / brand placeholder */}
        <div className='text-center'>
          <span className='text-lg font-bold tracking-tight'>Open Workspace RAG</span>
        </div>

        {/* Step content */}
        <div className='rounded-xl border bg-card p-8 shadow-sm'>
          {step === 0 && (
            <WelcomeStep orgName={organization?.name} onNext={() => setStep(1)} />
          )}
          {step === 1 && <CreateWorkspaceStep onNext={() => setStep(2)} />}
          {step === 2 && <DoneStep onDone={() => void navigate({ to: '/' })} />}
        </div>

        {/* Progress dots */}
        <StepDots current={step} />
      </div>
    </div>
  )
}
