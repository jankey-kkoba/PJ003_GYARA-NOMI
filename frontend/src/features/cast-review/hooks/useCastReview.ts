import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { castReviewsClient } from '@/libs/hono/client'
import { handleApiError, handleApiResponse } from '@/libs/react-query'
import type { CastReview } from '@/features/cast-review/types/castReview'
import type { CreateCastReviewInput } from '@/features/cast-review/schemas/createCastReview'
import { parseDate } from '@/utils/date'

/**
 * マッチングの評価を取得するフック
 */
export function useCastReview(matchingId: string) {
	return useQuery({
		queryKey: ['castReviews', matchingId],
		queryFn: async (): Promise<CastReview | null> => {
			const res = await castReviewsClient.api['cast-reviews'][
				':matchingId'
			].$get({
				param: { matchingId },
			})

			await handleApiError(res, '評価の取得に失敗しました')

			const result = await res.json()

			if (!result.data) {
				return null
			}

			// 日付文字列をDateオブジェクトに変換
			return {
				...result.data,
				createdAt: parseDate(result.data.createdAt as unknown as string),
				updatedAt: parseDate(result.data.updatedAt as unknown as string),
			}
		},
		enabled: !!matchingId,
	})
}

/**
 * 評価を作成するフック
 */
export function useCreateCastReview() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (input: CreateCastReviewInput) => {
			const res = await castReviewsClient.api['cast-reviews'].$post({
				json: input,
			})

			return handleApiResponse(res, '評価の送信に失敗しました')
		},
		onSuccess: (_, variables) => {
			// 評価キャッシュを更新
			queryClient.invalidateQueries({
				queryKey: ['castReviews', variables.matchingId],
			})
			// 完了済みマッチング一覧も更新（評価済みフラグの反映のため）
			queryClient.invalidateQueries({
				queryKey: ['completedSoloMatchings'],
			})
		},
	})
}
