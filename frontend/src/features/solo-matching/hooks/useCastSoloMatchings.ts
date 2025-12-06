import { useQuery } from '@tanstack/react-query'
import { castSoloMatchingsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'

/**
 * キャストのソロマッチング一覧取得のカスタムフック
 */
export function useCastSoloMatchings() {
	return useQuery({
		queryKey: ['castSoloMatchings'],
		queryFn: async (): Promise<SoloMatching[]> => {
			const res =
				await castSoloMatchingsClient.api['solo-matchings'].cast.$get()

			await handleApiError(res, 'マッチング一覧の取得に失敗しました')

			const result = await res.json()

			if (!result.success) {
				throw new Error('マッチング一覧の取得に失敗しました')
			}

			return result.soloMatchings
		},
	})
}
