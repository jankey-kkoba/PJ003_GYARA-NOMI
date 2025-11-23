import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { favoritesClient } from '@/libs/hono/client'
import { handleApiError, handleApiResponse } from '@/libs/react-query'

/**
 * お気に入り状態を取得するフック
 */
export function useFavoriteStatus(castId: string) {
  return useQuery({
    queryKey: ['favorites', castId],
    queryFn: async (): Promise<boolean> => {
      const res = await favoritesClient.api.favorites[':castId'].$get({
        param: { castId },
      })

      await handleApiError(res, 'お気に入り状態の取得に失敗しました')

      const result = await res.json()
      return result.data.isFavorite
    },
    enabled: !!castId,
  })
}

/**
 * お気に入りを追加するフック
 */
export function useAddFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (castId: string) => {
      const res = await favoritesClient.api.favorites[':castId'].$post({
        param: { castId },
      })

      return handleApiResponse(res, 'お気に入りの追加に失敗しました')
    },
    onSuccess: (_, castId) => {
      queryClient.setQueryData(['favorites', castId], true)
    },
  })
}

/**
 * お気に入りを削除するフック
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (castId: string) => {
      const res = await favoritesClient.api.favorites[':castId'].$delete({
        param: { castId },
      })

      return handleApiResponse(res, 'お気に入りの削除に失敗しました')
    },
    onSuccess: (_, castId) => {
      queryClient.setQueryData(['favorites', castId], false)
    },
  })
}
