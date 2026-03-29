import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from './api'
import type { DocumentFilters, PaginatedDocuments } from './data/schema'

export const DOCUMENTS_QUERY_KEY = ['documents'] as const

export function useDocuments(params: DocumentFilters) {
  return useQuery({
    queryKey: [...DOCUMENTS_QUERY_KEY, params] as const,
    queryFn: () => documentsApi.list(params),
    select: (data: PaginatedDocuments) => data,
  })
}

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: [...DOCUMENTS_QUERY_KEY, documentId] as const,
    queryFn: () => documentsApi.get(documentId),
    enabled: !!documentId,
  })
}

export function useUpdateDocument(documentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { title?: string | null; tag_id?: string | null }) =>
      documentsApi.update(documentId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData([...DOCUMENTS_QUERY_KEY, documentId], updated)
      void queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY })
    },
  })
}

export function useDeleteDocuments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentIds: string[]) => documentsApi.delete(documentIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY })
    },
  })
}

export function useUpdateDocumentsApproval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentIds, isApproved }: { documentIds: string[]; isApproved: boolean }) =>
      documentsApi.updateApproval(documentIds, isApproved),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY })
    },
  })
}
