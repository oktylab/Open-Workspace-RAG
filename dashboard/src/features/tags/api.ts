import apiClient from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'
import type { Tag, TagCreate, TagUpdate } from './data/schema'

const getSlug = () => {
  const { currentWorkspaceSlug } = useAuthStore.getState()
  if (!currentWorkspaceSlug) throw new Error('No workspace selected')
  return currentWorkspaceSlug
}

export const tagsApi = {
  list: async (): Promise<Tag[]> => {
    const slug = getSlug()
    return apiClient.get(`/tags/${slug}`).then((r) => r.data)
  },

  add: async (payload: TagCreate): Promise<Tag[]> => {
    const slug = getSlug()
    return apiClient.post(`/tags/${slug}`, payload).then((r) => r.data)
  },

  update: async (path: string, payload: TagUpdate): Promise<Tag> => {
    const slug = getSlug()
    return apiClient
      .patch(`/tags/${slug}?path=${encodeURIComponent(path)}`, payload)
      .then((r) => r.data)
  },

  delete: async (path: string): Promise<Tag[]> => {
    const slug = getSlug()
    return apiClient
      .delete(`/tags/${slug}?path=${encodeURIComponent(path)}`)
      .then((r) => r.data)
  },
}
