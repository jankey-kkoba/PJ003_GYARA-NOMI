import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { HTTPException } from 'hono/http-exception'
import { verifyAuth } from '@hono/auth-js'
import { zValidator } from '@hono/zod-validator'
import { userService } from '@/features/user/services/userService'
import { registerProfileSchema } from '@/features/user/schemas/registerProfile'
import { honoAuthMiddleware } from '@/libs/hono/middleware/auth'

/**
 * ユーザーAPI
 */
const app = new Hono().basePath('/api/users')

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
 * プロフィール登録エンドポイント
 * 認証済みユーザーのプロフィールを登録する
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const route = app.post(
  '/register',
  verifyAuth(),
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
      throw new HTTPException(400, { message: 'プロフィールは既に登録されています' })
    }

    // プロフィール作成とロール更新をトランザクションで実行
    const profile = await userService.registerProfile(userId, {
      name: data.name,
      birthDate: data.birthDate,
      userType: data.userType,
    })

    return c.json({ success: true, profile }, 201)
  }
)

export type UsersAppType = typeof route

export const GET = handle(app)
export const POST = handle(app)
