import { useMutation, useQueryClient } from '@tanstack/react-query'
import { guestGroupMatchingsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import type { GuestGroupMatching } from '@/features/group-matching/types/groupMatching'

/**
 * グループマッチング延長のパラメータ
 */
export type ExtendGroupMatchingParams = {
	matchingId: string
	extensionMinutes: number
}

/**
 * グループマッチング延長のカスタムフック
 * ゲストが「延長」ボタンを押してギャラ飲みを延長する
 */
export function useExtendGroupMatching() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (
			params: ExtendGroupMatchingParams,
		): Promise<GuestGroupMatching> => {
			const { matchingId, extensionMinutes } = params

			const res = await guestGroupMatchingsClient.api['group-matchings'].guest[
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

			return result.groupMatching
		},
		onSuccess: () => {
			// マッチング一覧のキャッシュを無効化して再取得
			queryClient.invalidateQueries({ queryKey: ['guestGroupMatchings'] })
		},
	})
}
