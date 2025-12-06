import { useMutation, useQueryClient } from '@tanstack/react-query'
import { castGroupMatchingsClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import type { CastGroupMatching } from '@/features/group-matching/types/groupMatching'

/**
 * グループマッチング終了のパラメータ
 */
export type CompleteGroupMatchingParams = {
	matchingId: string
}

/**
 * グループマッチング終了のカスタムフック
 * キャストが「終了」ボタンを押してギャラ飲みを終了する
 */
export function useCompleteGroupMatching() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (
			params: CompleteGroupMatchingParams,
		): Promise<CastGroupMatching> => {
			const { matchingId } = params

			const res = await castGroupMatchingsClient.api['group-matchings'].cast[
				':id'
			].end.$patch({
				param: { id: matchingId },
			})

			await handleApiError(res, 'グループマッチングの終了に失敗しました')

			const result = await res.json()

			if (!result.success) {
				throw new Error('グループマッチングの終了に失敗しました')
			}

			return result.groupMatching
		},
		onSuccess: () => {
			// グループマッチング一覧のキャッシュを無効化して再取得
			queryClient.invalidateQueries({ queryKey: ['castGroupMatchings'] })
		},
	})
}
