import { LoginActions } from '@/features/auth/components/molecules/LoginActions'
import { SignUpLinks } from '@/features/auth/components/molecules/SignUpLinks'

type LoginTemplateProps = {
  children?: React.ReactNode
}

/**
 * ログインページのテンプレート
 * Mobile Firstで実装
 */
export function LoginTemplate({ children }: LoginTemplateProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* ロゴ・タイトルエリア */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            ギャラ飲みプラットフォーム
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            キャストとゲストをつなぐプラットフォーム
          </p>
        </div>

        {/* 子コンポーネント（開発環境用ログインフォームなど） */}
        {children}

        {/* ログインボタンエリア */}
        <LoginActions />

        {/* サインアップリンク */}
        <SignUpLinks />
      </div>
    </div>
  )
}
