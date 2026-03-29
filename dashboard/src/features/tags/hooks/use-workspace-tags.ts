import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tagsApi } from '../api'
import type { TagCreate, TagUpdate } from '../data/schema'

export const TAGS_QUERY_KEY = ['tags'] as const

export function useWorkspaceTags() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: TAGS_QUERY_KEY,
    queryFn: tagsApi.list,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY })

  const addTag = useMutation({
    mutationFn: (payload: TagCreate) => tagsApi.add(payload),
    onSuccess: invalidate,
  })

  const updateTag = useMutation({
    mutationFn: ({ path, payload }: { path: string; payload: TagUpdate }) =>
      tagsApi.update(path, payload),
    onSuccess: invalidate,
  })

  const deleteTag = useMutation({
    mutationFn: (path: string) => tagsApi.delete(path),
    onSuccess: invalidate,
  })

  return {
    tags: query.data ?? [],
    isLoading: query.isLoading,
    addTag,
    updateTag,
    deleteTag,
  }
}
