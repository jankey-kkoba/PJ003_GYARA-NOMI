import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { favoritesClient } from '@/libs/hono/client'

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

      if (!res.ok) {
        throw new Error('お気に入り状態の取得に失敗しました')
      }

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

      if (!res.ok) {
        throw new Error('お気に入りの追加に失敗しました')
      }

      return res.json()
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

      if (!res.ok) {
        throw new Error('お気に入りの削除に失敗しました')
      }

      return res.json()
    },
    onSuccess: (_, castId) => {
      queryClient.setQueryData(['favorites', castId], false)
    },
  })
}
