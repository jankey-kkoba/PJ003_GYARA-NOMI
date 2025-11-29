import { useQuery } from '@tanstack/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'

/**
 * APIレスポンスの型
 */
type GetPendingOfferResponse = {
	success: true
	hasPendingOffer: boolean
	pendingOffer: SoloMatching | null
}

/**
 * 指定キャストへのpendingオファーを取得
 */
async function getPendingOffer(castId: string): Promise<{
	hasPendingOffer: boolean
	pendingOffer: SoloMatching | null
}> {
	const response = await fetch(`/api/solo-matchings/guest/pending/${castId}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	})

	if (!response.ok) {
		const error = await response.json()
		throw new Error(error.error || 'pendingオファーの取得に失敗しました')
	}

	const data: GetPendingOfferResponse = await response.json()
	return {
		hasPendingOffer: data.hasPendingOffer,
		pendingOffer: data.pendingOffer,
	}
}

/**
 * 指定キャストへのpendingオファー取得のカスタムフック
 * @param castId - キャストID
 */
export function usePendingOffer(castId: string) {
	return useQuery({
		queryKey: ['pendingOffer', castId],
		queryFn: () => getPendingOffer(castId),
	})
}
