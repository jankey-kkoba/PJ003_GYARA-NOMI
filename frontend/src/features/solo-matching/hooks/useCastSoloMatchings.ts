import { useQuery } from '@tanstack/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'

/**
 * APIレスポンスの型
 */
type GetCastSoloMatchingsResponse = {
  success: true
  soloMatchings: SoloMatching[]
}

/**
 * キャストのソロマッチング一覧を取得
 */
async function getCastSoloMatchings(): Promise<SoloMatching[]> {
  const response = await fetch('/api/solo-matchings/cast', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'マッチング一覧の取得に失敗しました')
  }

  const data: GetCastSoloMatchingsResponse = await response.json()
  return data.soloMatchings
}

/**
 * キャストのソロマッチング一覧取得のカスタムフック
 */
export function useCastSoloMatchings() {
  return useQuery({
    queryKey: ['castSoloMatchings'],
    queryFn: getCastSoloMatchings,
  })
}
