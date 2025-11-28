import { Hono, type MiddlewareHandler } from 'hono'
import { handle } from 'hono/vercel'
import { HTTPException } from 'hono/http-exception'
import { verifyAuth } from '@hono/auth-js'
import { zValidator } from '@hono/zod-validator'
import { userService } from '@/features/user/services/userService'
import { registerProfileSchema } from '@/features/user/schemas/registerProfile'
import { updateUserProfileSchema } from '@/features/user/schemas/updateUserProfile'
import { honoAuthMiddleware } from '@/libs/hono/middleware/auth'

type CreateUsersAppOptions = {
	/** Auth.js設定の初期化ミドルウェア */
	authMiddleware?: MiddlewareHandler
	/** 認証検証ミドルウェア */
	verifyAuthMiddleware?: MiddlewareHandler
}

/**
 * ユーザーAPI用Honoアプリを作成
 * @param options 認証ミドルウェアのオプション（テスト時に差し替え可能）
 */
export function createUsersApp(options: CreateUsersAppOptions = {}) {
	const {
		authMiddleware = honoAuthMiddleware,
		verifyAuthMiddleware = verifyAuth(),
	} = options

	const app = new Hono().basePath('/api/users')

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
		// プロフィール登録エンドポイント
		.post(
			'/register',
			verifyAuthMiddleware,
			zValidator('json', registerProfileSchema),
			async (c) => {
				// 認証済みユーザー情報を取得
				const authUser = c.get('authUser')
				// ユーザーIDを取得
				const userId = authUser.token?.id as string | undefined

				if (!userId) {
					throw new HTTPException(401, { message: '認証が必要です' })
				}

				const data = c.req.valid('json')

				// プロフィールが既に存在するか確認
				const hasProfile = await userService.hasProfile(userId)
				if (hasProfile) {
					throw new HTTPException(400, {
						message: 'プロフィールは既に登録されています',
					})
				}

				// プロフィール作成とロール更新をトランザクションで実行
				const profile = await userService.registerProfile(userId, {
					name: data.name,
					birthDate: data.birthDate,
					userType: data.userType,
				})

				return c.json({ success: true, profile }, 201)
			},
		)
		// プロフィール取得エンドポイント
		.get('/profile', verifyAuthMiddleware, async (c) => {
			const authUser = c.get('authUser')
			const userId = authUser.token?.id as string | undefined

			if (!userId) {
				throw new HTTPException(401, { message: '認証が必要です' })
			}

			const profile = await userService.getUserProfile(userId)

			if (!profile) {
				throw new HTTPException(404, {
					message: 'プロフィールが見つかりません',
				})
			}

			return c.json({ success: true, profile })
		})
		// プロフィール更新エンドポイント
		.put(
			'/profile',
			verifyAuthMiddleware,
			zValidator('json', updateUserProfileSchema),
			async (c) => {
				const authUser = c.get('authUser')
				const userId = authUser.token?.id as string | undefined

				if (!userId) {
					throw new HTTPException(401, { message: '認証が必要です' })
				}

				const data = c.req.valid('json')

				// プロフィールが存在するか確認
				const hasProfile = await userService.hasProfile(userId)
				if (!hasProfile) {
					throw new HTTPException(404, {
						message: 'プロフィールが見つかりません',
					})
				}

				// プロフィールを更新
				const profile = await userService.updateUserProfile(userId, {
					name: data.name,
					birthDate: data.birthDate,
				})

				return c.json({ success: true, profile })
			},
		)

	return { app, route }
}

const { app, route } = createUsersApp()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _route = route

export type UsersAppType = typeof route

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
