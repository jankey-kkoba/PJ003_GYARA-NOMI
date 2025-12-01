import { Hono, type MiddlewareHandler } from 'hono'
import { handle } from 'hono/vercel'
import { HTTPException } from 'hono/http-exception'
import { verifyAuth } from '@hono/auth-js'
import { zValidator } from '@hono/zod-validator'
import { soloMatchingService } from '@/features/solo-matching/services/soloMatchingService'
import { createSoloMatchingSchema } from '@/features/solo-matching/schemas/createSoloMatching'
import { extendSoloMatchingSchema } from '@/features/solo-matching/schemas/extendSoloMatching'
import { honoAuthMiddleware } from '@/libs/hono/middleware/auth'
import { userService } from '@/features/user/services/userService'

type CreateSoloMatchingsAppOptions = {
	/** Auth.js設定の初期化ミドルウェア */
	authMiddleware?: MiddlewareHandler
	/** 認証検証ミドルウェア */
	verifyAuthMiddleware?: MiddlewareHandler
}

/**
 * ゲストのソロマッチングAPI用Honoアプリを作成
 * @param options 認証ミドルウェアのオプション（テスト時に差し替え可能）
 */
export function createGuestSoloMatchingsApp(
	options: CreateSoloMatchingsAppOptions = {},
) {
	const {
		authMiddleware = honoAuthMiddleware,
		verifyAuthMiddleware = verifyAuth(),
	} = options

	const app = new Hono().basePath('/api/solo-matchings/guest')

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

	// チェーンルート形式で定義
	const route = app
		// ゲストのソロマッチング一覧取得エンドポイント
		.get('/', verifyAuthMiddleware, async (c) => {
			// 認証済みユーザー情報を取得
			const authUser = c.get('authUser')
			const userId = authUser.token?.id as string | undefined

			if (!userId) {
				throw new HTTPException(401, { message: '認証が必要です' })
			}

			// ユーザー情報を取得してロールを確認
			const user = await userService.findUserById(userId)
			if (!user) {
				throw new HTTPException(404, { message: 'ユーザーが見つかりません' })
			}

			// ゲストのみマッチング一覧を取得可能
			if (user.role !== 'guest') {
				throw new HTTPException(403, {
					message: 'ゲストのみマッチング一覧を取得できます',
				})
			}

			// ソロマッチング一覧を取得
			const soloMatchings =
				await soloMatchingService.getGuestSoloMatchings(userId)

			return c.json({ success: true, soloMatchings })
		})
		// ソロマッチングオファー作成エンドポイント
		.post(
			'/',
			verifyAuthMiddleware,
			zValidator('json', createSoloMatchingSchema),
			async (c) => {
				// 認証済みユーザー情報を取得
				const authUser = c.get('authUser')
				const userId = authUser.token?.id as string | undefined

				if (!userId) {
					throw new HTTPException(401, { message: '認証が必要です' })
				}

				// ユーザー情報を取得してロールを確認
				const user = await userService.findUserById(userId)
				if (!user) {
					throw new HTTPException(404, { message: 'ユーザーが見つかりません' })
				}

				// ゲストのみマッチングオファーを送信可能
				if (user.role !== 'guest') {
					throw new HTTPException(403, {
						message: 'ゲストのみマッチングオファーを送信できます',
					})
				}

				const data = c.req.valid('json')

				// proposedDateとproposedTimeOffsetMinutesの処理
				let proposedDate: Date | undefined
				let proposedTimeOffsetMinutes: number | undefined

				if (data.proposedTimeOffsetMinutes) {
					// 相対時間指定の場合
					proposedTimeOffsetMinutes = data.proposedTimeOffsetMinutes
				} else if (data.proposedDate) {
					// カスタム日時指定の場合（過去の日時チェックはスキーマで実施済み）
					proposedDate = new Date(data.proposedDate)
				}

				// ソロマッチングを作成
				const soloMatching = await soloMatchingService.createSoloMatching({
					guestId: userId,
					castId: data.castId,
					proposedDate,
					proposedTimeOffsetMinutes,
					proposedDuration: data.proposedDuration,
					proposedLocation: data.proposedLocation,
					hourlyRate: data.hourlyRate,
				})

				return c.json({ success: true, soloMatching }, 201)
			},
		)
		// 完了済みソロマッチング一覧取得エンドポイント
		.get('/completed', verifyAuthMiddleware, async (c) => {
			// 認証済みユーザー情報を取得
			const authUser = c.get('authUser')
			const userId = authUser.token?.id as string | undefined

			if (!userId) {
				throw new HTTPException(401, { message: '認証が必要です' })
			}

			// ユーザー情報を取得してロールを確認
			const user = await userService.findUserById(userId)
			if (!user) {
				throw new HTTPException(404, { message: 'ユーザーが見つかりません' })
			}

			// ゲストのみ完了済みマッチング一覧を取得可能
			if (user.role !== 'guest') {
				throw new HTTPException(403, {
					message: 'ゲストのみ完了済みマッチング一覧を取得できます',
				})
			}

			try {
				// 完了済みソロマッチング一覧を取得
				const soloMatchings =
					await soloMatchingService.getCompletedSoloMatchings(userId)
				return c.json({ success: true, soloMatchings })
			} catch (error) {
				console.error('Service error:', error)
				const message =
					error instanceof Error
						? error.message
						: '予期しないエラーが発生しました'
				throw new HTTPException(500, { message })
			}
		})
		// 指定キャストへのpendingオファー確認エンドポイント
		.get('/pending/:castId', verifyAuthMiddleware, async (c) => {
			// 認証済みユーザー情報を取得
			const authUser = c.get('authUser')
			const userId = authUser.token?.id as string | undefined

			if (!userId) {
				throw new HTTPException(401, { message: '認証が必要です' })
			}

			// ユーザー情報を取得してロールを確認
			const user = await userService.findUserById(userId)
			if (!user) {
				throw new HTTPException(404, { message: 'ユーザーが見つかりません' })
			}

			// ゲストのみ確認可能
			if (user.role !== 'guest') {
				throw new HTTPException(403, {
					message: 'ゲストのみpendingオファーを確認できます',
				})
			}

			const castId = c.req.param('castId')

			// pendingオファーを取得
			const pendingOffer = await soloMatchingService.getPendingOfferForCast(
				userId,
				castId,
			)

			return c.json({
				success: true,
				hasPendingOffer: pendingOffer !== null,
				pendingOffer,
			})
		})
		// ソロマッチング延長エンドポイント
		.patch(
			'/:id/extend',
			verifyAuthMiddleware,
			zValidator('json', extendSoloMatchingSchema),
			async (c) => {
				// 認証済みユーザー情報を取得
				const authUser = c.get('authUser')
				const userId = authUser.token?.id as string | undefined

				if (!userId) {
					throw new HTTPException(401, { message: '認証が必要です' })
				}

				// ユーザー情報を取得してロールを確認
				const user = await userService.findUserById(userId)
				if (!user) {
					throw new HTTPException(404, { message: 'ユーザーが見つかりません' })
				}

				// ゲストのみ延長可能
				if (user.role !== 'guest') {
					throw new HTTPException(403, {
						message: 'ゲストのみマッチングを延長できます',
					})
				}

				const matchingId = c.req.param('id')
				const data = c.req.valid('json')

				try {
					const soloMatching = await soloMatchingService.extendSoloMatching(
						matchingId,
						userId,
						data.extensionMinutes,
					)
					return c.json({ success: true, soloMatching })
				} catch (error) {
					// サービス層のエラーは全て500として返す
					console.error('Service error:', error)
					const message =
						error instanceof Error
							? error.message
							: '予期しないエラーが発生しました'
					throw new HTTPException(500, { message })
				}
			},
		)

	return { app, route }
}

const { app, route } = createGuestSoloMatchingsApp()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _route = route

export type GuestSoloMatchingsAppType = typeof route

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
