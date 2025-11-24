import { Hono, type MiddlewareHandler } from 'hono'
import { handle } from 'hono/vercel'
import { HTTPException } from 'hono/http-exception'
import { verifyAuth } from '@hono/auth-js'
import { soloMatchingService } from '@/features/solo-matching/services/soloMatchingService'
import { honoAuthMiddleware } from '@/libs/hono/middleware/auth'
import { userService } from '@/features/user/services/userService'

type CreateCastSoloMatchingsAppOptions = {
  /** Auth.js設定の初期化ミドルウェア */
  authMiddleware?: MiddlewareHandler
  /** 認証検証ミドルウェア */
  verifyAuthMiddleware?: MiddlewareHandler
}

/**
 * キャストのソロマッチングAPI用Honoアプリを作成
 * @param options 認証ミドルウェアのオプション（テスト時に差し替え可能）
 */
export function createCastSoloMatchingsApp(options: CreateCastSoloMatchingsAppOptions = {}) {
  const { authMiddleware = honoAuthMiddleware, verifyAuthMiddleware = verifyAuth() } = options

  const app = new Hono().basePath('/api/solo-matchings/cast')

  // Auth.js設定の初期化
  app.use('*', authMiddleware)

  // エラーハンドラー
  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ success: false, error: err.message }, err.status)
    }
    console.error('Unexpected error:', err)
    return c.json({ success: false, error: '予期しないエラーが発生しました' }, 500)
  })

  // キャストのソロマッチング一覧取得エンドポイント
  const route = app.get('/', verifyAuthMiddleware, async (c) => {
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
      throw new HTTPException(403, { message: 'キャストのみマッチング一覧を取得できます' })
    }

    // ソロマッチング一覧を取得
    const soloMatchings = await soloMatchingService.getCastSoloMatchings(userId)

    return c.json({ success: true, soloMatchings })
  })

  return { app, route }
}

const { app, route } = createCastSoloMatchingsApp()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _route = route

export type CastSoloMatchingsAppType = typeof route

export const GET = handle(app)
