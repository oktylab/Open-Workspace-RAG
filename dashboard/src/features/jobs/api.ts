import apiClient from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'
import type {
  Job,
  JobConfigInput,
  PaginatedJobs,
} from './data/schema'

const getSlug = () => {
  const { currentWorkspaceSlug } = useAuthStore.getState()
  if (!currentWorkspaceSlug) throw new Error('No workspace selected')
  return currentWorkspaceSlug
}

export const jobsApi = {
  list: async (params: {
    skip?: number
    limit?: number
    status?: string[]
  }): Promise<PaginatedJobs> => {
    const slug = getSlug()
    const searchParams = new URLSearchParams()
    if (params.skip !== undefined) searchParams.set('skip', String(params.skip))
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit))
    if (params.status?.length) {
      params.status.forEach((s) => searchParams.append('status', s))
    }
    return apiClient
      .get(`/jobs/${slug}?${searchParams.toString()}`)
      .then((r) => r.data)
  },

  get: async (jobId: string): Promise<Job> => {
    const slug = getSlug()
    return apiClient.get(`/jobs/${slug}/${jobId}`).then((r) => r.data)
  },

  create: async (config: JobConfigInput): Promise<Job> => {
    const slug = getSlug()
    return apiClient.post(`/jobs/${slug}/url`, config).then((r) => r.data)
  },

  createPdf: async (files: File[]): Promise<Job> => {
    const slug = getSlug()
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    return apiClient
      .post(`/jobs/${slug}/pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  update: async (jobId: string, config: JobConfigInput): Promise<Job> => {
    const slug = getSlug()
    return apiClient.patch(`/jobs/${slug}/${jobId}`, config).then((r) => r.data)
  },

  run: async (jobIds: string[]): Promise<Job[]> => {
    const slug = getSlug()
    return apiClient.post(`/jobs/${slug}/run`, jobIds).then((r) => r.data)
  },

  delete: async (jobIds: string[]): Promise<void> => {
    const slug = getSlug()
    return apiClient.delete(`/jobs/${slug}`, { data: jobIds }).then((r) => r.data)
  },
}
