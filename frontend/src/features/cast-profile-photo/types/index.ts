/**
 * キャストプロフィール写真の型定義
 */

/**
 * プロフィール写真
 */
export type CastProfilePhoto = {
	id: string
	castProfileId: string
	photoUrl: string
	displayOrder: number
	createdAt: string
	updatedAt: string
}

/**
 * プロフィール写真作成用のデータ
 */
export type CreateCastProfilePhotoData = {
	castProfileId: string
	photoUrl: string
	displayOrder: number
}

/**
 * プロフィール写真更新用のデータ
 */
export type UpdateCastProfilePhotoData = {
	displayOrder?: number
}

/**
 * プロフィール写真のアップロード結果
 */
export type PhotoUploadResult = {
	photoUrl: string
	publicUrl: string
}
