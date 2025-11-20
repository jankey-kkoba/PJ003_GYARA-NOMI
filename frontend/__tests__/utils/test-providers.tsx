/**
 * テスト用プロバイダーコンポーネント
 *
 * コンポーネントテストで必要なプロバイダーをラップする
 */

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'

// テスト用のデフォルトセッション
export const mockSession: Session = {
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
  },
}

// 未認証状態のセッション
export const unauthenticatedSession = null

interface TestProvidersProps {
  children: React.ReactNode
  session?: Session | null
  queryClient?: QueryClient
}

/**
 * テスト用のプロバイダーラッパー
 */
export function TestProviders({
  children,
  session = mockSession,
  queryClient,
}: TestProvidersProps) {
  // テスト用 QueryClient（キャッシュなし、リトライなし）
  const testQueryClient =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    })

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  )
}

/**
 * QueryClient のみのプロバイダー（認証が不要なテスト用）
 */
export function QueryOnlyProvider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient?: QueryClient
}) {
  const testQueryClient =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    })

  return <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
}
