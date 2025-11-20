import { useQuery } from '@tanstack/react-query'
import { castsClient } from '@/libs/hono/client'
import type { CastListResponse } from '@/features/cast/types'
import { CASTS_PER_PAGE } from '@/features/cast/constants'

/**
 * キャスト一覧取得のクエリパラメータ
 */
type UseCastListParams = {
  page?: number
  limit?: number
}

/**
 * キャスト一覧取得用のqueryフック
 * @param params - ページネーションパラメータ
 * @returns query オブジェクト
 */
export function useCastList(params: UseCastListParams = {}) {
  const { page = 1, limit = CASTS_PER_PAGE } = params

  return useQuery({
    queryKey: ['casts', 'list', page, limit],
    queryFn: async (): Promise<CastListResponse> => {
      const res = await castsClient.api.casts.$get({
        query: {
          page: String(page),
          limit: String(limit),
        },
      })

      if (!res.ok) {
        const errorData = await res.json()
        const errorMessage =
          'error' in errorData && typeof errorData.error === 'string'
            ? errorData.error
            : 'キャスト一覧の取得に失敗しました'
        throw new Error(errorMessage)
      }

      const result = await res.json()

      if (!result.success || !result.data) {
        throw new Error('キャスト一覧の取得に失敗しました')
      }

      return result.data
    },
  })
}
