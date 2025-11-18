'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogoutButton } from '@/features/auth/components/atoms/LogoutButton'
import { useAuth } from '@/features/auth/hooks/useAuth'

/**
 * ホームページのテンプレート
 */
export function HomeTemplate() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    // 認証チェック
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !user) {
    return null // ローディング中または未認証
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            ギャラ飲みプラットフォーム
          </h1>
          <p className="mb-4 text-gray-600">ようこそ、{user.name}さん</p>

          <LogoutButton variant="outline" />
        </div>
      </div>
    </div>
  )
}
