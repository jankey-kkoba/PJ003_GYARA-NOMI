import { useQuery } from '@tanstack/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'

/**
 * APIレスポンスの型
 */
type GetGuestSoloMatchingsResponse = {
	success: true
	soloMatchings: SoloMatching[]
}

/**
 * ゲストのソロマッチング一覧を取得
 */
async function getGuestSoloMatchings(): Promise<SoloMatching[]> {
	const response = await fetch('/api/solo-matchings/guest', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	})

	if (!response.ok) {
		const error = await response.json()
		throw new Error(error.error || 'マッチング一覧の取得に失敗しました')
	}

	const data: GetGuestSoloMatchingsResponse = await response.json()
	return data.soloMatchings
}

/**
 * ゲストのソロマッチング一覧取得のカスタムフック
 */
export function useGuestSoloMatchings() {
	return useQuery({
		queryKey: ['guestSoloMatchings'],
		queryFn: getGuestSoloMatchings,
	})
}
