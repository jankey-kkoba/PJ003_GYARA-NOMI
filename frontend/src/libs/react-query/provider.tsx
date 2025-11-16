'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { DEFAULT_STALE_TIME, DEFAULT_RETRY_COUNT } from '@/libs/react-query/constants'

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
