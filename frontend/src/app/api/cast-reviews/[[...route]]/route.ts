import { Hono, type MiddlewareHandler } from 'hono'
import { handle } from 'hono/vercel'
import { HTTPException } from 'hono/http-exception'
import { verifyAuth } from '@hono/auth-js'
import { castReviewService } from '@/features/cast-review/services/castReviewService'
import { createCastReviewSchema } from '@/features/cast-review/schemas/createCastReview'
import { honoAuthMiddleware } from '@/libs/hono/middleware/auth'

type CreateCastReviewsAppOptions = {
	authMiddleware?: MiddlewareHandler
	verifyAuthMiddleware?: MiddlewareHandler
}

/**
 * キャスト評価API用Honoアプリを作成
 */
export function createCastReviewsApp(
	options: CreateCastReviewsAppOptions = {},
) {
	const {
		authMiddleware = honoAuthMiddleware,
		verifyAuthMiddleware = verifyAuth(),
	} = options

	const app = new Hono().basePath('/api/cast-reviews')

	app.use('*', authMiddleware)

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
		// 評価を作成
		.post('/', verifyAuthMiddleware, async (c) => {
			const authUser = c.get('authUser')
			const token = authUser.token

			if (!token?.id) {
				throw new HTTPException(401, { message: '認証が必要です' })
			}

			if (token.role !== 'guest') {
				throw new HTTPException(403, {
					message: 'この機能はゲストユーザーのみ利用できます',
				})
			}

			const body = await c.req.json()
			const parsed = createCastReviewSchema.safeParse(body)

			if (!parsed.success) {
				throw new HTTPException(400, {
					message: parsed.error.issues[0].message,
				})
			}

			const { matchingId, rating, comment } = parsed.data

			try {
				const review = await castReviewService.createReview(
					token.id,
					matchingId,
					rating,
					comment,
				)
				return c.json({ success: true, data: review })
			} catch (error) {
				console.error('Service error:', error)
				const message =
					error instanceof Error
						? error.message
						: '予期しないエラーが発生しました'
				throw new HTTPException(500, { message })
			}
		})
		// マッチングIDで評価を取得
		.get('/:matchingId', verifyAuthMiddleware, async (c) => {
			const authUser = c.get('authUser')
			const token = authUser.token

			if (!token?.id) {
				throw new HTTPException(401, { message: '認証が必要です' })
			}

			const matchingId = c.req.param('matchingId')

			try {
				const review = await castReviewService.getReviewByMatchingId(matchingId)
				return c.json({ success: true, data: review })
			} catch (error) {
				console.error('Service error:', error)
				const message =
					error instanceof Error
						? error.message
						: '予期しないエラーが発生しました'
				throw new HTTPException(500, { message })
			}
		})

	return { app, route }
}

const { app, route } = createCastReviewsApp()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _route = route

export type CastReviewsAppType = typeof route

export const GET = handle(app)
export const POST = handle(app)
