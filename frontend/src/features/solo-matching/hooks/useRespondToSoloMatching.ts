import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'

/**
 * マッチング回答のパラメータ
 */
export type RespondToSoloMatchingParams = {
	matchingId: string
	response: 'accepted' | 'rejected'
}

/**
 * APIレスポンスの型
 */
type RespondToSoloMatchingResponse = {
	success: true
	matching: SoloMatching
}

/**
 * マッチングに回答する
 */
async function respondToSoloMatching(
	params: RespondToSoloMatchingParams,
): Promise<SoloMatching> {
	const { matchingId, response } = params

	const apiResponse = await fetch(`/api/solo-matchings/cast/${matchingId}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ response }),
	})

	if (!apiResponse.ok) {
		const error = await apiResponse.json()
		throw new Error(error.error || 'マッチングへの回答に失敗しました')
	}

	const data: RespondToSoloMatchingResponse = await apiResponse.json()
	return data.matching
}

/**
 * マッチング回答のカスタムフック
 * キャストがマッチングオファーに承認/拒否で回答する
 */
export function useRespondToSoloMatching() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: respondToSoloMatching,
		onSuccess: () => {
			// マッチング一覧のキャッシュを無効化して再取得
			queryClient.invalidateQueries({ queryKey: ['castSoloMatchings'] })
		},
	})
}
