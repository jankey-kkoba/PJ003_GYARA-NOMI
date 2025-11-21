import { useQuery } from '@tanstack/react-query'
import { castsClient } from '@/libs/hono/client'
import type { CastDetail } from '@/features/cast/types'

/**
 * キャスト詳細取得用のqueryフック
 * @param castId - キャストID
 * @returns query オブジェクト
 */
export function useCastDetail(castId: string) {
  return useQuery({
    queryKey: ['casts', 'detail', castId],
    queryFn: async (): Promise<CastDetail> => {
      const res = await castsClient.api.casts[':castId'].$get({
        param: { castId },
      })

      if (!res.ok) {
        const errorData = await res.json()
        const errorMessage =
          'error' in errorData && typeof errorData.error === 'string'
            ? errorData.error
            : 'キャスト詳細の取得に失敗しました'
        throw new Error(errorMessage)
      }

      const result = await res.json()

      if (!result.success || !result.data) {
        throw new Error('キャスト詳細の取得に失敗しました')
      }

      return result.data.cast
    },
    enabled: !!castId,
  })
}
