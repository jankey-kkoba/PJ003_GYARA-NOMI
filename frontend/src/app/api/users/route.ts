import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { HTTPException } from 'hono/http-exception'
import { verifyAuth, initAuthConfig, type AuthConfig } from '@hono/auth-js'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import Line from 'next-auth/providers/line'
import { userService } from '@/features/user/services/userService'
import {
  AUTH_SECRET,
  LINE_CLIENT_ID,
  LINE_CLIENT_SECRET,
} from '@/libs/constants/env'

/**
 * プロフィール登録リクエストのスキーマ
 */
const registerProfileSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  birthDate: z.string().min(1, '生年月日は必須です'),
  userType: z.enum(['guest', 'cast']),
})

/**
 * ユーザーAPI
 */
const app = new Hono().basePath('/api/users')

/**
 * Auth.js設定の初期化
 */
app.use(
  '*',
  initAuthConfig((): AuthConfig => ({
    secret: AUTH_SECRET,
    providers: [
      Line({
        clientId: LINE_CLIENT_ID,
        clientSecret: LINE_CLIENT_SECRET,
      }),
    ],
  }))
)

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
    const userId = authUser.session?.user?.id

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
