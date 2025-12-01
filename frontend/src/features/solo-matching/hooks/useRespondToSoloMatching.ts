import { useMutation, useQueryClient } from '@tanstack/react-query'
import { castSoloMatchingsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'
import { parseSoloMatching } from '@/features/solo-matching/utils/parseSoloMatching'

/**
 * マッチング回答のパラメータ
 */
export type RespondToSoloMatchingParams = {
	matchingId: string
	response: 'accepted' | 'rejected'
}

/**
 * マッチング回答のカスタムフック
 * キャストがマッチングオファーに承認/拒否で回答する
 */
export function useRespondToSoloMatching() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (
			params: RespondToSoloMatchingParams,
		): Promise<SoloMatching> => {
			const { matchingId, response } = params

			const res =
				await castSoloMatchingsClient.api['solo-matchings'].cast[':id'].$patch({
					param: { id: matchingId },
					json: { response },
				})

			await handleApiError(res, 'マッチングへの回答に失敗しました')

			const result = await res.json()

			if (!result.success) {
				throw new Error('マッチングへの回答に失敗しました')
			}

			return parseSoloMatching(result.matching)
		},
		onSuccess: () => {
			// マッチング一覧のキャッシュを無効化して再取得
			queryClient.invalidateQueries({ queryKey: ['castSoloMatchings'] })
		},
	})
}
