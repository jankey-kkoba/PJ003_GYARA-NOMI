'use client'

import Link from 'next/link'
import { LineLoginButton } from '@/features/auth/components/atoms/LineLoginButton'

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
      </div>
    </div>
  )
}
