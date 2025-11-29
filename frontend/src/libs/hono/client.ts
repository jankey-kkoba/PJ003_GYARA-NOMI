import { hc } from 'hono/client'
import type { UsersAppType } from '@/app/api/users/[[...route]]/route'
import type { CastsAppType } from '@/app/api/casts/[[...route]]/route'
import type { FavoritesAppType } from '@/app/api/favorites/[[...route]]/route'
import type { PhotosAppType } from '@/app/api/casts/photos/[[...route]]/route'
import type { CastReviewsAppType } from '@/app/api/cast-reviews/[[...route]]/route'

/**
 * Honoクライアントのベースオプション
 */
const clientOptions = {
	init: {
		credentials: 'include' as const,
	},
}

/**
 * ユーザーAPIクライアント
 * 型安全なRPCクライアント
 */
export const usersClient = hc<UsersAppType>('/', clientOptions)

/**
 * キャストAPIクライアント
 * 型安全なRPCクライアント
 */
export const castsClient = hc<CastsAppType>('/', clientOptions)

/**
 * お気に入りAPIクライアント
 * 型安全なRPCクライアント
 */
export const favoritesClient = hc<FavoritesAppType>('/', clientOptions)

/**
 * キャストプロフィール写真APIクライアント
 * 型安全なRPCクライアント
 */
export const photosClient = hc<PhotosAppType>('/', clientOptions)

/**
 * キャスト評価APIクライアント
 * 型安全なRPCクライアント
 */
export const castReviewsClient = hc<CastReviewsAppType>('/', clientOptions)
