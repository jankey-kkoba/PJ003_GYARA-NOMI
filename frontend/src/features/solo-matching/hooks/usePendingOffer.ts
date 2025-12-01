import { useQuery } from '@tanstack/react-query'
import { guestSoloMatchingsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'
import { parseSoloMatchingOrNull } from '@/features/solo-matching/utils/parseSoloMatching'

/**
 * 指定キャストへのpendingオファー取得のカスタムフック
 * @param castId - キャストID
 */
export function usePendingOffer(castId: string) {
	return useQuery({
		queryKey: ['pendingOffer', castId],
		queryFn: async (): Promise<{
			hasPendingOffer: boolean
			pendingOffer: SoloMatching | null
		}> => {
			const res = await guestSoloMatchingsClient.api[
				'solo-matchings'
			].guest.pending[':castId'].$get({
				param: { castId },
			})

			await handleApiError(res, 'pendingオファーの取得に失敗しました')

			const result = await res.json()

			if (!result.success) {
				throw new Error('pendingオファーの取得に失敗しました')
			}

			return {
				hasPendingOffer: result.hasPendingOffer,
				pendingOffer: parseSoloMatchingOrNull(result.pendingOffer),
			}
		},
	})
}
