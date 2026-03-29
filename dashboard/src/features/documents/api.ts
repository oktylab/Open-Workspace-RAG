import apiClient from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'
import type {
  DocumentWithChunks,
  PaginatedDocuments,
  DocumentFilters,
} from './data/schema'

const getSlug = () => {
  const { currentWorkspaceSlug } = useAuthStore.getState()
  if (!currentWorkspaceSlug) throw new Error('No workspace selected')
  return currentWorkspaceSlug
}

export const documentsApi = {
  list: async (params: DocumentFilters): Promise<PaginatedDocuments> => {
    const slug = getSlug()
    const searchParams = new URLSearchParams()
    if (params.skip !== undefined) searchParams.set('skip', String(params.skip))
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit))
    if (params.is_approved !== undefined) searchParams.set('is_approved', String(params.is_approved))
    
    if (params.q !== undefined) searchParams.set('q', params.q)
    
    params.document_ids?.forEach((id) => searchParams.append('document_ids', id))
    params.job_ids?.forEach((id) => searchParams.append('job_ids', id))
    params.langs?.forEach((lang) => searchParams.append('langs', lang))
    params.actions?.forEach((action) => searchParams.append('actions', action))

    return apiClient
      .get(`/documents/${slug}?${searchParams.toString()}`)
      .then((r) => r.data)
  },

  get: async (documentId: string): Promise<DocumentWithChunks> => {
    const slug = getSlug()
    return apiClient.get(`/documents/${slug}/${documentId}`).then((r) => r.data)
  },

  delete: async (documentIds: string[]): Promise<void> => {
    const slug = getSlug()
    // Based on router: @router.delete("/{slug}") expecting document_ids in body or query?
    // Let's re-read the router.
    // @router.delete("/{slug}")
    // async def delete_documents(..., document_ids: List[uuid.UUID]):
    // FastAPI usually expects List[uuid.UUID] in body for DELETE if not specified as Query.
    // Wait, let's check document.py line 66 again.
    return apiClient.delete(`/documents/${slug}`, { data: documentIds }).then((r) => r.data)
  },

  update: async (documentId: string, payload: { title?: string | null; tag?: string | null }): Promise<DocumentWithChunks> => {
    const slug = getSlug()
    return apiClient.patch(`/documents/${slug}/${documentId}`, payload).then((r) => r.data)
  },

  updateApproval: async (documentIds: string[], isApproved: boolean): Promise<void> => {
    const slug = getSlug()
    return apiClient.patch(`/documents/${slug}/approval?is_approved=${isApproved}`, documentIds).then((r) => r.data)
  },
}
