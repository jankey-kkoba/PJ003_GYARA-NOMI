import { useQuery } from '@tanstack/react-query'
import { guestSoloMatchingsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'
import { parseSoloMatchings } from '@/features/solo-matching/utils/parseSoloMatching'

/**
 * 完了済みソロマッチング一覧取得のカスタムフック
 */
export function useCompletedSoloMatchings() {
	return useQuery({
		queryKey: ['completedSoloMatchings'],
		queryFn: async (): Promise<SoloMatching[]> => {
			const res =
				await guestSoloMatchingsClient.api['solo-matchings'].guest.completed.$get()

			await handleApiError(res, '完了済みマッチング一覧の取得に失敗しました')

			const result = await res.json()

			if (!result.success) {
				throw new Error('完了済みマッチング一覧の取得に失敗しました')
			}

			return parseSoloMatchings(result.soloMatchings)
		},
	})
}
