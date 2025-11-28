import { useQuery } from '@tanstack/react-query'
import { photosClient } from '@/libs/hono/client'
import { handleApiError } from '@/libs/react-query'
import type { CastProfilePhoto } from '@/features/cast-profile-photo/types'

/**
 * 写真一覧取得用のAPIレスポンス型
 */
type PhotoWithPublicUrl = CastProfilePhoto & {
	publicUrl: string
}

/**
 * キャストプロフィール写真一覧取得用のqueryフック
 * @param castId - キャストID
 * @returns query オブジェクト
 */
export function usePhotos(castId: string) {
	return useQuery({
		queryKey: ['casts', 'photos', castId],
		queryFn: async (): Promise<PhotoWithPublicUrl[]> => {
			const res = await photosClient.api.casts.photos[':castId'].$get({
				param: { castId },
			})

			await handleApiError(res, '写真一覧の取得に失敗しました')

			const result = await res.json()

			if (!result.success || !result.data) {
				throw new Error('写真一覧の取得に失敗しました')
			}

			// Date型に変換
			return result.data.photos.map((photo) => ({
				...photo,
				createdAt: new Date(photo.createdAt),
				updatedAt: new Date(photo.updatedAt),
			}))
		},
		enabled: !!castId,
	})
}
