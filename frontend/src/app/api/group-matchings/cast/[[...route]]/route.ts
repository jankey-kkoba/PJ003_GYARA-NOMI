import { Hono, type MiddlewareHandler } from 'hono'
import { handle } from 'hono/vercel'
import { HTTPException } from 'hono/http-exception'
import { verifyAuth } from '@hono/auth-js'
import { zValidator } from '@hono/zod-validator'
import { groupMatchingService } from '@/features/group-matching/services/groupMatchingService'
import { respondToGroupMatchingSchema } from '@/features/group-matching/schemas/respondToGroupMatching'
import { honoAuthMiddleware } from '@/libs/hono/middleware/auth'
import { userService } from '@/features/user/services/userService'

type CreateCastGroupMatchingsAppOptions = {
	/** Auth.js設定の初期化ミドルウェア */
	authMiddleware?: MiddlewareHandler
	/** 認証検証ミドルウェア */
	verifyAuthMiddleware?: MiddlewareHandler
}

/**
 * キャストのグループマッチングAPI用Honoアプリを作成
 * @param options 認証ミドルウェアのオプション（テスト時に差し替え可能）
 */
export function createCastGroupMatchingsApp(
	options: CreateCastGroupMatchingsAppOptions = {},
) {
	const {
		authMiddleware = honoAuthMiddleware,
		verifyAuthMiddleware = verifyAuth(),
	} = options

	const app = new Hono().basePath('/api/group-matchings/cast')

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
		// キャストのグループマッチング一覧取得エンドポイント
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

			// キャストのみマッチング一覧を取得可能
			if (user.role !== 'cast') {
				throw new HTTPException(403, {
					message: 'キャストのみグループマッチング一覧を取得できます',
				})
			}

			// グループマッチング一覧を取得
			const groupMatchings =
				await groupMatchingService.getCastGroupMatchings(userId)

			return c.json({ success: true, groupMatchings })
		})
		// キャストのグループマッチング回答エンドポイント
		.patch(
			'/:id',
			verifyAuthMiddleware,
			zValidator('json', respondToGroupMatchingSchema),
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

				// キャストのみ回答可能
				if (user.role !== 'cast') {
					throw new HTTPException(403, {
						message: 'キャストのみグループマッチングに回答できます',
					})
				}

				// マッチングIDを取得
				const matchingId = c.req.param('id')

				// バリデーション済みのリクエストボディを取得
				const { response } = c.req.valid('json')

				// マッチングに回答
				const updatedMatching =
					await groupMatchingService.respondToGroupMatching(
						matchingId,
						userId,
						response,
					)

				return c.json({ success: true, groupMatching: updatedMatching })
			},
		)
		// キャストのグループマッチング開始エンドポイント（合流ボタン）
		.patch('/:id/start', verifyAuthMiddleware, async (c) => {
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

			// キャストのみ開始可能
			if (user.role !== 'cast') {
				throw new HTTPException(403, {
					message: 'キャストのみマッチングを開始できます',
				})
			}

			// マッチングIDを取得
			const matchingId = c.req.param('id')

			// マッチングを開始
			const updatedMatching = await groupMatchingService.startGroupMatching(
				matchingId,
				userId,
			)

			return c.json({ success: true, groupMatching: updatedMatching })
		})
		// キャストのグループマッチング終了エンドポイント（終了ボタン）
		.patch('/:id/end', verifyAuthMiddleware, async (c) => {
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

			// キャストのみ終了可能
			if (user.role !== 'cast') {
				throw new HTTPException(403, {
					message: 'キャストのみマッチングを終了できます',
				})
			}

			// マッチングIDを取得
			const matchingId = c.req.param('id')

			// マッチングを終了
			const updatedMatching = await groupMatchingService.completeGroupMatching(
				matchingId,
				userId,
			)

			return c.json({ success: true, groupMatching: updatedMatching })
		})

	return { app, route }
}

const { app, route } = createCastGroupMatchingsApp()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _route = route

export type CastGroupMatchingsAppType = typeof route

export const GET = handle(app)
export const PATCH = handle(app)
