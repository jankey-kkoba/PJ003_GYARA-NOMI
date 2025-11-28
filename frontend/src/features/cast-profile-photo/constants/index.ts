/**
 * キャストプロフィール写真機能の定数定義
 */

/**
 * Supabase Storageバケット名
 */
export const STORAGE_BUCKET_NAME = 'cast-profile-photos'

/**
 * 許可される画像ファイル形式
 */
export const ALLOWED_IMAGE_TYPES = [
	'image/png',
	'image/jpeg',
	'image/jpg',
	'image/webp',
] as const

/**
 * 許可される画像ファイル形式（accept属性用）
 */
export const ALLOWED_IMAGE_TYPES_ACCEPT = ALLOWED_IMAGE_TYPES.join(',')

/**
 * 最大ファイルサイズ（バイト）
 * 5MB
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * 最大ファイルサイズ（MB表示用）
 */
export const MAX_FILE_SIZE_MB = 5

/**
 * エラーメッセージ
 */
export const ERROR_MESSAGES = {
	FILE_REQUIRED: '画像ファイルが必要です',
	INVALID_FILE_TYPE:
		'許可されていないファイル形式です。PNG、JPEG、WEBPのいずれかを使用してください',
	FILE_TOO_LARGE: `ファイルサイズは${MAX_FILE_SIZE_MB}MB以下にしてください`,
} as const
