'use client'

import Link from 'next/link'
import { LineLoginButton } from '@/features/auth/components/atoms/LineLoginButton'
import { CredentialsLoginForm } from '@/features/auth/components/atoms/CredentialsLoginForm'
import { APP_ENV } from '@/libs/constants/env'

/**
 * ログインページのテンプレート
 * Mobile Firstで実装
 */
export function LoginTemplate() {
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

        {/* 開発環境用ログインフォーム */}
        {APP_ENV === 'development' && (
          <CredentialsLoginForm
            title="開発環境用ログイン"
            description="E2Eテスト・手元確認用（本番では表示されません）"
            showDevHelpText={true}
            variant="dev"
          />
        )}

        {/* ログインボタンエリア */}
        <div className="space-y-4">
          <LineLoginButton />

          <p className="text-center text-xs text-muted-foreground">
            ログインすることで
            <Link href="#" className="text-primary hover:underline">
              利用規約
            </Link>
            と
            <Link href="#" className="text-primary hover:underline">
              プライバシーポリシー
            </Link>
            に同意したものとみなされます
          </p>
        </div>

        {/* サインアップリンク */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            アカウントをお持ちでない方は
          </p>
          <div className="mt-2 flex justify-center gap-4">
            <Link
              href="/sign-up?type=guest"
              className="text-sm font-medium text-primary hover:underline"
            >
              ゲストとして登録
            </Link>
            <Link
              href="/sign-up?type=cast"
              className="text-sm font-medium text-primary hover:underline"
            >
              キャストとして登録
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
