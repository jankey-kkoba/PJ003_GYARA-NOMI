import { useMutation, useQueryClient } from '@tanstack/react-query'
import { guestSoloMatchingsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'

/**
 * マッチング延長のパラメータ
 */
export type ExtendSoloMatchingParams = {
	matchingId: string
	extensionMinutes: number
}

/**
 * マッチング延長のカスタムフック
 * ゲストが「延長」ボタンを押してギャラ飲みを延長する
 */
export function useExtendSoloMatching() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (
			params: ExtendSoloMatchingParams,
		): Promise<SoloMatching> => {
			const { matchingId, extensionMinutes } = params

			const res = await guestSoloMatchingsClient.api['solo-matchings'].guest[
				':id'
			].extend.$patch({
				param: { id: matchingId },
				json: { extensionMinutes },
			})

			await handleApiError(res, 'マッチングの延長に失敗しました')

			const result = await res.json()

			if (!result.success) {
				throw new Error('マッチングの延長に失敗しました')
			}

			return result.soloMatching
		},
		onSuccess: () => {
			// マッチング一覧のキャッシュを無効化して再取得
			queryClient.invalidateQueries({ queryKey: ['guestSoloMatchings'] })
		},
	})
}
