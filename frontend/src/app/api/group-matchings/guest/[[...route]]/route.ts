import { Hono, type MiddlewareHandler } from 'hono'
import { handle } from 'hono/vercel'
import { HTTPException } from 'hono/http-exception'
import { verifyAuth } from '@hono/auth-js'
import { zValidator } from '@hono/zod-validator'
import { groupMatchingService } from '@/features/group-matching/services/groupMatchingService'
import { createGroupMatchingSchema } from '@/features/group-matching/schemas/createGroupMatching'
import { extendGroupMatchingSchema } from '@/features/group-matching/schemas/extendGroupMatching'
import { honoAuthMiddleware } from '@/libs/hono/middleware/auth'
import { userService } from '@/features/user/services/userService'

type CreateGroupMatchingsAppOptions = {
	/** Auth.js設定の初期化ミドルウェア */
	authMiddleware?: MiddlewareHandler
	/** 認証検証ミドルウェア */
	verifyAuthMiddleware?: MiddlewareHandler
}

/**
 * ゲストのグループマッチングAPI用Honoアプリを作成
 * @param options 認証ミドルウェアのオプション（テスト時に差し替え可能）
 */
export function createGuestGroupMatchingsApp(
	options: CreateGroupMatchingsAppOptions = {},
) {
	const {
		authMiddleware = honoAuthMiddleware,
		verifyAuthMiddleware = verifyAuth(),
	} = options

	const app = new Hono().basePath('/api/group-matchings/guest')

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
		// ゲストのグループマッチング一覧取得エンドポイント
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
					message: 'ゲストのみグループマッチング一覧を取得できます',
				})
			}

			// グループマッチング一覧を取得
			const groupMatchings =
				await groupMatchingService.getGuestGroupMatchings(userId)

			return c.json({ success: true, groupMatchings })
		})
		// グループマッチングオファー作成エンドポイント
		.post(
			'/',
			verifyAuthMiddleware,
			zValidator('json', createGroupMatchingSchema),
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
						message: 'ゲストのみグループマッチングオファーを送信できます',
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
					// カスタム日時指定の場合
					proposedDate = new Date(data.proposedDate)
				}

				// グループマッチングを作成
				const result = await groupMatchingService.createGroupMatching({
					guestId: userId,
					requestedCastCount: data.requestedCastCount,
					proposedDate,
					proposedTimeOffsetMinutes,
					proposedDuration: data.proposedDuration,
					proposedLocation: data.proposedLocation,
					minAge: data.minAge,
					maxAge: data.maxAge,
				})

				// 条件に合うキャストが0人の場合は200、成功の場合は201を返す
				const statusCode = result.participantCount === 0 ? 200 : 201

				return c.json(
					{
						success: true,
						groupMatching: result.matching,
						participantCount: result.participantCount,
					},
					statusCode,
				)
			},
		)
		// グループマッチング延長エンドポイント
		.patch(
			'/:id/extend',
			verifyAuthMiddleware,
			zValidator('json', extendGroupMatchingSchema),
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
					const groupMatching = await groupMatchingService.extendGroupMatching(
						matchingId,
						userId,
						data.extensionMinutes,
					)
					return c.json({ success: true, groupMatching })
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

const { app, route } = createGuestGroupMatchingsApp()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _route = route

export type GuestGroupMatchingsAppType = typeof route

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
