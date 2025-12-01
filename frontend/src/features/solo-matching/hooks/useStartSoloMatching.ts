import { useMutation, useQueryClient } from '@tanstack/react-query'
import { castSoloMatchingsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'
import { parseSoloMatching } from '@/features/solo-matching/utils/parseSoloMatching'

/**
 * マッチング開始のパラメータ
 */
export type StartSoloMatchingParams = {
	matchingId: string
}

/**
 * マッチング開始のカスタムフック
 * キャストが「合流」ボタンを押してギャラ飲みを開始する
 */
export function useStartSoloMatching() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (
			params: StartSoloMatchingParams,
		): Promise<SoloMatching> => {
			const { matchingId } = params

			const res =
				await castSoloMatchingsClient.api['solo-matchings'].cast[':id'].start.$patch(
					{
						param: { id: matchingId },
					},
				)

			await handleApiError(res, 'マッチングの開始に失敗しました')

			const result = await res.json()

			if (!result.success) {
				throw new Error('マッチングの開始に失敗しました')
			}

			return parseSoloMatching(result.matching)
		},
		onSuccess: () => {
			// マッチング一覧のキャッシュを無効化して再取得
			queryClient.invalidateQueries({ queryKey: ['castSoloMatchings'] })
		},
	})
}
