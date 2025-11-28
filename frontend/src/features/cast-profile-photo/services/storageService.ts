import { createClient } from '@/libs/supabase/server'
import type { PhotoUploadResult } from '@/features/cast-profile-photo/types'
import { STORAGE_BUCKET_NAME } from '@/features/cast-profile-photo/constants'
import { NEXT_PUBLIC_SUPABASE_URL } from '@/libs/constants/env'

/**
 * キャストプロフィール写真のストレージサービス
 * Supabase Storageへの画像アップロード・削除を提供
 *
 * Auth.jsのセッションからSupabaseのJWTトークンを自動取得し、
 * RLSポリシーに基づいてアクセス制御を行う
 */
export const storageService = {
	/**
	 * プロフィール写真をアップロード
	 * @param castProfileId - キャストプロフィールID
	 * @param file - アップロードするファイル
	 * @returns アップロード結果（パスとURL）
	 */
	async uploadPhoto(
		castProfileId: string,
		file: File,
	): Promise<PhotoUploadResult> {
		const supabase = await createClient()

		// ファイル名をユニークにする（タイムスタンプ + ランダム文字列）
		const timestamp = Date.now()
		const randomStr = Math.random().toString(36).substring(2, 15)
		const fileExt = file.name.split('.').pop()
		const fileName = `${castProfileId}/${timestamp}_${randomStr}.${fileExt}`

		// ファイルをアップロード
		const { data, error } = await supabase.storage
			.from(STORAGE_BUCKET_NAME)
			.upload(fileName, file, {
				cacheControl: '3600',
				upsert: false,
			})

		if (error) {
			throw new Error(`画像のアップロードに失敗しました: ${error.message}`)
		}

		// 公開URLを取得
		const {
			data: { publicUrl },
		} = supabase.storage.from(STORAGE_BUCKET_NAME).getPublicUrl(data.path)

		return {
			photoUrl: data.path,
			publicUrl,
		}
	},

	/**
	 * プロフィール写真を削除
	 * @param photoUrl - 削除する写真のパス
	 */
	async deletePhoto(photoUrl: string): Promise<void> {
		const supabase = await createClient()

		const { error } = await supabase.storage
			.from(STORAGE_BUCKET_NAME)
			.remove([photoUrl])

		if (error) {
			throw new Error(`画像の削除に失敗しました: ${error.message}`)
		}
	},

	/**
	 * 複数のプロフィール写真を削除
	 * @param photoUrls - 削除する写真のパス配列
	 */
	async deletePhotos(photoUrls: string[]): Promise<void> {
		const supabase = await createClient()

		const { error } = await supabase.storage
			.from(STORAGE_BUCKET_NAME)
			.remove(photoUrls)

		if (error) {
			throw new Error(`画像の削除に失敗しました: ${error.message}`)
		}
	},

	/**
	 * 公開URLを取得
	 * @param photoUrl - 写真のパス
	 * @returns 公開URL
	 */
	getPublicUrl(photoUrl: string): string {
		// サーバーサイドで同期的にURLを生成できないため、
		// クライアント側で使用する簡易的な実装
		// 本番環境では環境変数から取得したURLを使用
		const supabaseUrl = NEXT_PUBLIC_SUPABASE_URL
		return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET_NAME}/${photoUrl}`
	},
}
