import { Hono, type MiddlewareHandler } from 'hono'
import { handle } from 'hono/vercel'
import { HTTPException } from 'hono/http-exception'
import { verifyAuth } from '@hono/auth-js'
import { favoriteService } from '@/features/favorite/services/favoriteService'
import { honoAuthMiddleware } from '@/libs/hono/middleware/auth'

type CreateFavoritesAppOptions = {
	authMiddleware?: MiddlewareHandler
	verifyAuthMiddleware?: MiddlewareHandler
}

/**
 * お気に入りAPI用Honoアプリを作成
 */
export function createFavoritesApp(options: CreateFavoritesAppOptions = {}) {
	const {
		authMiddleware = honoAuthMiddleware,
		verifyAuthMiddleware = verifyAuth(),
	} = options

	const app = new Hono().basePath('/api/favorites')

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
		// お気に入り状態を取得
		.get('/:castId', verifyAuthMiddleware, async (c) => {
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

			const castId = c.req.param('castId')
			const isFavorite = await favoriteService.isFavorite(token.id, castId)

			return c.json({ success: true, data: { isFavorite } })
		})
		// お気に入りに追加
		.post('/:castId', verifyAuthMiddleware, async (c) => {
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

			const castId = c.req.param('castId')
			await favoriteService.addFavorite(token.id, castId)

			return c.json({ success: true, data: { isFavorite: true } })
		})
		// お気に入りから削除
		.delete('/:castId', verifyAuthMiddleware, async (c) => {
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

			const castId = c.req.param('castId')
			await favoriteService.removeFavorite(token.id, castId)

			return c.json({ success: true, data: { isFavorite: false } })
		})

	return { app, route }
}

const { app, route } = createFavoritesApp()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _route = route

export type FavoritesAppType = typeof route

export const GET = handle(app)
export const POST = handle(app)
export const DELETE = handle(app)
