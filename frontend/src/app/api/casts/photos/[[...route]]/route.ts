import { Hono, type MiddlewareHandler } from 'hono'
import { handle } from 'hono/vercel'
import { HTTPException } from 'hono/http-exception'
import { verifyAuth } from '@hono/auth-js'
import { zValidator } from '@hono/zod-validator'
import { photoService } from '@/features/cast-profile-photo/services/photoService'
import { storageService } from '@/features/cast-profile-photo/services/storageService'
import { honoAuthMiddleware } from '@/libs/hono/middleware/auth'
import {
	uploadPhotoSchema,
	updatePhotoSchema,
} from '@/features/cast-profile-photo/schemas/photoSchemas'

type CreatePhotosAppOptions = {
	/** Auth.js設定の初期化ミドルウェア */
	authMiddleware?: MiddlewareHandler
	/** 認証検証ミドルウェア */
	verifyAuthMiddleware?: MiddlewareHandler
}

/**
 * キャストプロフィール写真API用Honoアプリを作成
 * @param options 認証ミドルウェアのオプション（テスト時に差し替え可能）
 */
export function createPhotosApp(options: CreatePhotosAppOptions = {}) {
	const {
		authMiddleware = honoAuthMiddleware,
		verifyAuthMiddleware = verifyAuth(),
	} = options

	const app = new Hono().basePath('/api/casts/photos')

	// Auth.js設定の初期化
	app.use('*', authMiddleware)

	// エラーハンドラー
	app.onError((err, c) => {
		if (err instanceof HTTPException) {
			return c.json({ success: false, error: err.message }, err.status)
		}
		console.error('Unexpected error:', err)
		return c.json(
			{ success: false, error: '予期しないエラーが発生しました' },
			500,
		)
	})

	const route = app
		// プロフィール写真をアップロード
		.post(
			'/',
			verifyAuthMiddleware,
			zValidator('form', uploadPhotoSchema),
			async (c) => {
				const authUser = c.get('authUser')
				const token = authUser.token

				// ユーザーIDとロールをチェック
				if (!token?.id) {
					throw new HTTPException(401, { message: '認証が必要です' })
				}

				// キャストユーザーのみアクセス可能
				if (token.role !== 'cast') {
					throw new HTTPException(403, {
						message: 'この機能はキャストユーザーのみ利用できます',
					})
				}

				// バリデーション済みのファイルを取得
				const { file } = c.req.valid('form')
				const castProfileId = token.id

				let photoUrl: string | null = null

				try {
					// Storageにアップロード
					const uploadResult = await storageService.uploadPhoto(
						castProfileId,
						file,
					)
					photoUrl = uploadResult.photoUrl
					const publicUrl = uploadResult.publicUrl

					// 次の表示順序を取得
					const displayOrder =
						await photoService.getNextDisplayOrder(castProfileId)

					// DBに保存
					const photo = await photoService.createPhoto({
						castProfileId,
						photoUrl,
						displayOrder,
					})

					return c.json({
						success: true,
						data: {
							photo: {
								...photo,
								publicUrl,
							},
						},
					})
				} catch (error) {
					// DB操作失敗時、Storageからロールバック（補償トランザクション）
					if (photoUrl) {
						try {
							await storageService.deletePhoto(photoUrl)
						} catch (rollbackError) {
							console.error('ロールバック処理に失敗しました:', rollbackError)
							// ロールバック失敗はログのみ。元のエラーを優先して再スロー
						}
					}
					throw error
				}
			},
		)
		// 特定のキャストの写真一覧を取得
		.get('/:castId', verifyAuthMiddleware, async (c) => {
			const authUser = c.get('authUser')
			const token = authUser.token

			// ユーザーIDとロールをチェック
			if (!token?.id) {
				throw new HTTPException(401, { message: '認証が必要です' })
			}

			const castId = c.req.param('castId')
			const photos = await photoService.getPhotosByCastId(castId)

			// 公開URLを付与
			const photosWithPublicUrl = photos.map((photo) => ({
				...photo,
				publicUrl: storageService.getPublicUrl(photo.photoUrl),
			}))

			return c.json({
				success: true,
				data: {
					photos: photosWithPublicUrl,
				},
			})
		})
		// プロフィール写真を削除
		.delete('/:photoId', verifyAuthMiddleware, async (c) => {
			const authUser = c.get('authUser')
			const token = authUser.token

			// ユーザーIDとロールをチェック
			if (!token?.id) {
				throw new HTTPException(401, { message: '認証が必要です' })
			}

			// キャストユーザーのみアクセス可能
			if (token.role !== 'cast') {
				throw new HTTPException(403, {
					message: 'この機能はキャストユーザーのみ利用できます',
				})
			}

			const photoId = c.req.param('photoId')
			const castProfileId = token.id

			// 写真情報を取得
			const photos = await photoService.getPhotosByCastId(castProfileId)
			const photo = photos.find((p) => p.id === photoId)

			if (!photo) {
				throw new HTTPException(404, { message: '写真が見つかりません' })
			}

			// 自分の写真かチェック
			if (photo.castProfileId !== castProfileId) {
				throw new HTTPException(403, {
					message: '他のユーザーの写真は削除できません',
				})
			}

			// DBから削除（先にDB削除を行う）
			await photoService.deletePhoto(photoId)

			// Storageから削除
			await storageService.deletePhoto(photo.photoUrl)

			return c.json({
				success: true,
				data: null,
			})
		})
		// プロフィール写真の表示順を更新
		.put(
			'/:photoId',
			verifyAuthMiddleware,
			zValidator('json', updatePhotoSchema),
			async (c) => {
				const authUser = c.get('authUser')
				const token = authUser.token

				// ユーザーIDとロールをチェック
				if (!token?.id) {
					throw new HTTPException(401, { message: '認証が必要です' })
				}

				// キャストユーザーのみアクセス可能
				if (token.role !== 'cast') {
					throw new HTTPException(403, {
						message: 'この機能はキャストユーザーのみ利用できます',
					})
				}

				const photoId = c.req.param('photoId')
				const castProfileId = token.id
				const { displayOrder } = c.req.valid('json')

				// 写真情報を取得
				const photos = await photoService.getPhotosByCastId(castProfileId)
				const photo = photos.find((p) => p.id === photoId)

				if (!photo) {
					throw new HTTPException(404, { message: '写真が見つかりません' })
				}

				// 自分の写真かチェック
				if (photo.castProfileId !== castProfileId) {
					throw new HTTPException(403, {
						message: '他のユーザーの写真は更新できません',
					})
				}

				// 表示順を更新
				const updatedPhoto = await photoService.updatePhoto(photoId, {
					displayOrder,
				})

				return c.json({
					success: true,
					data: {
						photo: {
							...updatedPhoto,
							publicUrl: storageService.getPublicUrl(updatedPhoto.photoUrl),
						},
					},
				})
			},
		)

	return { app, route }
}

const { app, route } = createPhotosApp()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _route = route

export type PhotosAppType = typeof route

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
