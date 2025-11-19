'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/features/auth/hooks/useAuth'

/**
 * サインアップテンプレートのProps
 */
type SignUpTemplateProps = {
  userType: 'guest' | 'cast'
}

/**
 * サインアップテンプレート
 * LINEログインボタンを表示し、ユーザータイプを保持して認証を開始
 */
export function SignUpTemplate({ userType }: SignUpTemplateProps) {
  const { lineLogin } = useAuth()

  const handleLineLogin = () => {
    // userTypeをcallbackUrlに含めて認証後に引き継ぐ
    lineLogin(userType)
  }

  const userTypeLabel = userType === 'guest' ? 'ゲスト' : 'キャスト'

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{userTypeLabel}として始める</CardTitle>
          <CardDescription>
            LINEアカウントで簡単に登録できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleLineLogin}
            className="w-full bg-line hover:bg-line-hover"
            size="lg"
          >
            LINEで始める
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
