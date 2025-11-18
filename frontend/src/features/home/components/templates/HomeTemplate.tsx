'use client'

import { LogoutButton } from '@/features/auth/components/atoms/LogoutButton'

/**
 * ホームページのテンプレート
 * 認証チェックはMiddlewareで行うため、ここでは行わない
 */
export function HomeTemplate() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            ギャラ飲みプラットフォーム
          </h1>
          <p className="mb-4 text-gray-600">ようこそ</p>

          <LogoutButton variant="outline" />
        </div>
      </div>
    </div>
  )
}
