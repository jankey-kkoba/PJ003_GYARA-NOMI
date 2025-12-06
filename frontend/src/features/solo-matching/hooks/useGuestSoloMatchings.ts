import { useQuery } from '@tanstack/react-query'
import { guestSoloMatchingsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'

/**
 * ゲストのソロマッチング一覧取得のカスタムフック
 */
export function useGuestSoloMatchings() {
	return useQuery({
		queryKey: ['guestSoloMatchings'],
		queryFn: async (): Promise<SoloMatching[]> => {
			const res =
				await guestSoloMatchingsClient.api['solo-matchings'].guest.$get()

			await handleApiError(res, 'マッチング一覧の取得に失敗しました')

			const result = await res.json()

			if (!result.success) {
				throw new Error('マッチング一覧の取得に失敗しました')
			}

			return result.soloMatchings
		},
	})
}
