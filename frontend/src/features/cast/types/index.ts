/**
 * キャスト一覧表示用の型定義
 */

/**
 * キャスト情報（一覧表示用）
 */
export type CastListItem = {
	id: string
	name: string
	age: number
	bio: string | null
	rank: number
	areaName: string | null
	thumbnailUrl: string | null // 代表写真の公開URL
}

/**
 * キャスト一覧取得のレスポンス
 */
export type CastListResponse = {
	casts: CastListItem[]
	total: number
	page: number
	limit: number
	totalPages: number
}

/**
 * キャスト一覧取得のクエリパラメータ
 */
export type CastListQuery = {
	page?: number
	limit?: number
}

/**
 * キャスト詳細情報
 */
export type CastDetail = {
	id: string
	name: string
	age: number
	bio: string | null
	rank: number
	areaName: string | null
	// 今後、画像等が追加される予定
}

/**
 * キャスト詳細取得のレスポンス
 */
export type CastDetailResponse = {
	cast: CastDetail
}
