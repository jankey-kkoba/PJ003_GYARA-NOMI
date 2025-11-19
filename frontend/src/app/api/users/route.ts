import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { userService } from '@/features/user/services/userService'
import { auth } from '@/libs/auth'

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
 * プロフィール登録エンドポイント
 * 認証済みユーザーのプロフィールを登録する
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const route = app.post(
  '/register',
  zValidator('json', registerProfileSchema),
  async (c) => {
    // セッションからユーザーIDを取得
    const session = await auth()
    if (!session?.user?.id) {
      return c.json({ success: false, error: '認証が必要です' }, 401)
    }

    const data = c.req.valid('json')
    const userId = session.user.id

    try {
      // プロフィールが既に存在するか確認
      const hasProfile = await userService.hasProfile(userId)
      if (hasProfile) {
        return c.json({ success: false, error: 'プロフィールは既に登録されています' }, 400)
      }

      // プロフィール作成とロール更新をトランザクションで実行
      const profile = await userService.registerProfile(userId, {
        name: data.name,
        birthDate: data.birthDate,
        userType: data.userType,
      })

      return c.json({ success: true, profile }, 201)
    } catch (error) {
      console.error('Profile registration error:', error)

      if (error instanceof Error) {
        return c.json({ success: false, error: error.message }, 400)
      }

      return c.json({ success: false, error: '登録に失敗しました' }, 500)
    }
  }
)

export type UsersAppType = typeof route

export const GET = handle(app)
export const POST = handle(app)
