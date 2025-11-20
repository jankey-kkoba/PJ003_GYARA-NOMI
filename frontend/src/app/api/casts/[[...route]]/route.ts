import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { HTTPException } from 'hono/http-exception'
import { verifyAuth } from '@hono/auth-js'
import { zValidator } from '@hono/zod-validator'
import { castService } from '@/features/cast/services/castService'
import { honoAuthMiddleware } from '@/libs/hono/middleware/auth'
import { castListQuerySchema } from '@/features/cast/schemas/castListQuery'

/**
 * キャストAPI
 */
const app = new Hono().basePath('/api/casts')

/**
 * Auth.js設定の初期化
 */
app.use('*', honoAuthMiddleware)

/**
 * エラーハンドラー
 * HTTPExceptionをJSON形式でレスポンス
 */
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ success: false, error: err.message }, err.status)
  }
  console.error('Unexpected error:', err)
  return c.json({ success: false, error: '予期しないエラーが発生しました' }, 500)
})

/**
 * キャスト一覧取得エンドポイント
 * 認証済みのゲストユーザーのみがアクセス可能
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const route = app.get('/', zValidator('query', castListQuerySchema), verifyAuth(), async (c) => {
  // 認証済みユーザー情報を取得
  const authUser = c.get('authUser')
  const token = authUser.token

  // ユーザーIDとロールをチェック
  if (!token?.id) {
    throw new HTTPException(401, { message: '認証が必要です' })
  }

  // ゲストユーザーのみアクセス可能
  if (token.role !== 'guest') {
    throw new HTTPException(403, {
      message: 'この機能はゲストユーザーのみ利用できます',
    })
  }

  // バリデーション済みのクエリパラメータを取得
  const { page, limit } = c.req.valid('query')

  // キャスト一覧を取得
  const { casts, total } = await castService.getCastList({ page, limit })

  // 総ページ数を計算
  const totalPages = Math.ceil(total / limit)

  return c.json({
    success: true,
    data: {
      casts,
      total,
      page,
      limit,
      totalPages,
    },
  })
})

export type CastsAppType = typeof route

export const GET = handle(app)
