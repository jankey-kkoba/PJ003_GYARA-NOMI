'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { toast } from 'sonner'
import { DEFAULT_STALE_TIME, DEFAULT_RETRY_COUNT } from '@/libs/react-query/constants'
import { ApiError } from './errors'

/**
 * React Queryのプロバイダーコンポーネント
 * クライアントコンポーネントとしてアプリケーション全体をラップ
 */
export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: DEFAULT_STALE_TIME,
            retry: DEFAULT_RETRY_COUNT,
          },
          mutations: {
            // mutationのデフォルトエラーハンドリング
            onError: (error) => {
              handleGlobalError(error)
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

/**
 * グローバルエラーハンドラー
 * すべてのquery/mutationで発生したエラーを処理する
 */
function handleGlobalError(error: Error) {
  // ApiErrorの場合
  if (error instanceof ApiError) {
    // ユーザーに表示すべきエラーのみtoast表示
    if (error.shouldShowToUser()) {
      toast.error(error.message)
    }

    // エラータイプに応じた追加処理
    if (error.type === 'authentication') {
      // 認証エラーの場合はログイン画面へリダイレクト等の処理を追加可能
      console.warn('認証エラーが発生しました:', error.message)
    }

    return
  }

  // それ以外のエラー
  const message = error.message || '予期しないエラーが発生しました'
  toast.error(message)
}
