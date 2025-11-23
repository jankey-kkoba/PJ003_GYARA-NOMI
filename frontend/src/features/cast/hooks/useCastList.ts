import { useQuery } from '@tanstack/react-query'
import { castsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import type { CastListResponse } from '@/features/cast/types'
import { CASTS_PER_PAGE } from '@/features/cast/constants'

/**
 * キャスト一覧取得のクエリパラメータ
 */
type UseCastListParams = {
  page?: number
  limit?: number
  minAge?: number
  maxAge?: number
}

/**
 * キャスト一覧取得用のqueryフック
 * @param params - ページネーションパラメータ
 * @returns query オブジェクト
 */
export function useCastList(params: UseCastListParams = {}) {
  const { page = 1, limit = CASTS_PER_PAGE, minAge, maxAge } = params

  return useQuery({
    queryKey: ['casts', 'list', page, limit, minAge, maxAge],
    queryFn: async (): Promise<CastListResponse> => {
      const query: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      }
      if (minAge !== undefined) query.minAge = String(minAge)
      if (maxAge !== undefined) query.maxAge = String(maxAge)

      const res = await castsClient.api.casts.$get({ query })

      await handleApiError(res, 'キャスト一覧の取得に失敗しました')

      const result = await res.json()

      if (!result.success || !result.data) {
        throw new Error('キャスト一覧の取得に失敗しました')
      }

      return result.data
    },
  })
}
