'use client'

import { LogoutButton } from '@/features/auth/components/atoms/LogoutButton'
import { LoginSuccessToast } from '@/features/home/components/atoms/LoginSuccessToast'

interface HomeTemplateProps {
  showLoginSuccessToast: boolean
}

/**
 * ホームページのテンプレート
 */
export function HomeTemplate({ showLoginSuccessToast }: HomeTemplateProps) {

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 px-4 py-8">
      <LoginSuccessToast show={showLoginSuccessToast} />
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
