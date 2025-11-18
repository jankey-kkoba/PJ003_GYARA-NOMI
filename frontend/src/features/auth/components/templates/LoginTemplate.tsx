'use client'

import { LineLoginButton } from '@/features/auth/components/atoms/LineLoginButton'

/**
 * ログインページのテンプレート
 * Mobile Firstで実装
 */
export function LoginTemplate() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* ロゴ・タイトルエリア */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            ギャラ飲みプラットフォーム
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            キャストとゲストをつなぐプラットフォーム
          </p>
        </div>

        {/* ログインボタンエリア */}
        <div className="space-y-4">
          <LineLoginButton />

          <p className="text-center text-xs text-gray-500">
            ログインすることで
            <a href="#" className="text-blue-600 hover:underline">
              利用規約
            </a>
            と
            <a href="#" className="text-blue-600 hover:underline">
              プライバシーポリシー
            </a>
            に同意したものとみなされます
          </p>
        </div>
      </div>
    </div>
  )
}
