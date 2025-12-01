import { useMutation, useQueryClient } from '@tanstack/react-query'
import { castSoloMatchingsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'
import { parseSoloMatching } from '@/features/solo-matching/utils/parseSoloMatching'

/**
 * マッチング終了のパラメータ
 */
export type CompleteSoloMatchingParams = {
	matchingId: string
}

/**
 * マッチング終了のカスタムフック
 * キャストが「終了」ボタンを押してギャラ飲みを終了する
 */
export function useCompleteSoloMatching() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (
			params: CompleteSoloMatchingParams,
		): Promise<SoloMatching> => {
			const { matchingId } = params

			const res = await castSoloMatchingsClient.api['solo-matchings'].cast[
				':id'
			].end.$patch({
				param: { id: matchingId },
			})

			await handleApiError(res, 'マッチングの終了に失敗しました')

			const result = await res.json()

			if (!result.success) {
				throw new Error('マッチングの終了に失敗しました')
			}

			return parseSoloMatching(result.matching)
		},
		onSuccess: () => {
			// マッチング一覧のキャッシュを無効化して再取得
			queryClient.invalidateQueries({ queryKey: ['castSoloMatchings'] })
		},
	})
}
