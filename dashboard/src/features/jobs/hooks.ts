import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from './api'
import type { Job, JobConfigInput, PaginatedJobs } from './data/schema'
import { useAuthStore } from '@/stores/auth-store'

export const JOBS_QUERY_KEY = ['jobs'] as const

export function useJobProgress(job: Job | undefined) {
  const queryClient = useQueryClient()
  const currentWorkspaceSlug = useAuthStore((state) => state.currentWorkspaceSlug)

  useEffect(() => {
    if (!job || !currentWorkspaceSlug) return

    const isPendingOrStarted = job.status === 'PENDING' || job.status === 'STARTED'
    if (!isPendingOrStarted) return

    // Do not track jobs that haven't been updated in over an hour
    const updatedTime = new Date(job.updated_at).getTime()
    const now = new Date().getTime()
    if (now - updatedTime > 60 * 60 * 1000) return

    const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'
    const eventSource = new EventSource(`${baseUrl}/jobs/${currentWorkspaceSlug}/${job.id}/progress`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.error) {
          eventSource.close()
          return
        }

        // Update single job cache
        queryClient.setQueryData([...JOBS_QUERY_KEY, job.id], (oldJob: Job | undefined) => {
          if (!oldJob) return oldJob
          return {
            ...oldJob,
            ...data,
          }
        })

        // Update jobs list cache
        queryClient.setQueriesData({ queryKey: JOBS_QUERY_KEY }, (oldData: PaginatedJobs | undefined) => {
          if (!oldData?.items) return oldData
          return {
            ...oldData,
            items: oldData.items.map((item) => {
              if (item.id === job.id) {
                return {
                  ...item,
                  ...data,
                }
              }
              return item
            }),
          }
        })

        if (data.status === 'SUCCESS' || data.status === 'FAILURE') {
          eventSource.close()
        }
      } catch {
        // Silently ignore parse errors
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [job, currentWorkspaceSlug, queryClient])
}

export function useJobs(params: {
  skip?: number
  limit?: number
  status?: string[]
}) {
  return useQuery({
    queryKey: [...JOBS_QUERY_KEY, params] as const,
    queryFn: () => jobsApi.list(params),
    select: (data: PaginatedJobs) => data,
  })
}

export function useJob(jobId: string) {
  return useQuery({
    queryKey: [...JOBS_QUERY_KEY, jobId] as const,
    queryFn: () => jobsApi.get(jobId),
    enabled: !!jobId,
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (config: JobConfigInput) => jobsApi.create(config),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY })
    },
  })
}

export function useCreatePdfJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (files: File[]) => jobsApi.createPdf(files),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY })
    },
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, config }: { jobId: string; config: JobConfigInput }) =>
      jobsApi.update(jobId, config),
    onSuccess: (_, { jobId }) => {
      void queryClient.invalidateQueries({ queryKey: [...JOBS_QUERY_KEY, jobId] })
      void queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY })
    },
  })
}

export function useRunJobs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (jobIds: string[]) => jobsApi.run(jobIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY })
    },
  })
}

export function useDeleteJobs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (jobIds: string[]) => jobsApi.delete(jobIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY })
    },
  })
}
