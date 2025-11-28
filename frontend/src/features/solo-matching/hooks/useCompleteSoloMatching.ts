import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'

/**
 * マッチング終了のパラメータ
 */
export type CompleteSoloMatchingParams = {
	matchingId: string
}

/**
 * APIレスポンスの型
 */
type CompleteSoloMatchingResponse = {
	success: true
	matching: SoloMatching
}

/**
 * マッチングを終了する
 */
async function completeSoloMatching(
	params: CompleteSoloMatchingParams,
): Promise<SoloMatching> {
	const { matchingId } = params

	const apiResponse = await fetch(
		`/api/solo-matchings/cast/${matchingId}/end`,
		{
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
		},
	)

	if (!apiResponse.ok) {
		const error = await apiResponse.json()
		throw new Error(error.error || 'マッチングの終了に失敗しました')
	}

	const data: CompleteSoloMatchingResponse = await apiResponse.json()
	return data.matching
}

/**
 * マッチング終了のカスタムフック
 * キャストが「終了」ボタンを押してギャラ飲みを終了する
 */
export function useCompleteSoloMatching() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: completeSoloMatching,
		onSuccess: () => {
			// マッチング一覧のキャッシュを無効化して再取得
			queryClient.invalidateQueries({ queryKey: ['castSoloMatchings'] })
		},
	})
}
