import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'

/**
 * マッチング延長のパラメータ
 */
export type ExtendSoloMatchingParams = {
	matchingId: string
	extensionMinutes: number
}

/**
 * APIレスポンスの型
 */
type ExtendSoloMatchingResponse = {
	success: true
	soloMatching: SoloMatching
}

/**
 * マッチングを延長する
 */
async function extendSoloMatching(
	params: ExtendSoloMatchingParams,
): Promise<SoloMatching> {
	const { matchingId, extensionMinutes } = params

	const apiResponse = await fetch(
		`/api/solo-matchings/guest/${matchingId}/extend`,
		{
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ extensionMinutes }),
		},
	)

	if (!apiResponse.ok) {
		const error = await apiResponse.json()
		throw new Error(error.error || 'マッチングの延長に失敗しました')
	}

	const data: ExtendSoloMatchingResponse = await apiResponse.json()
	return data.soloMatching
}

/**
 * マッチング延長のカスタムフック
 * ゲストが「延長」ボタンを押してギャラ飲みを延長する
 */
export function useExtendSoloMatching() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: extendSoloMatching,
		onSuccess: () => {
			// マッチング一覧のキャッシュを無効化して再取得
			queryClient.invalidateQueries({ queryKey: ['guestSoloMatchings'] })
		},
	})
}
