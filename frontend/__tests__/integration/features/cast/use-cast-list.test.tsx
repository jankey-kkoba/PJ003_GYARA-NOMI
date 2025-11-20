/**
 * useCastList hook 統合テスト
 *
 * キャスト一覧取得クエリの動作を検証
 * API呼び出し、成功/エラーハンドリング、クエリキーの生成をテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { CastListResponse } from '@/features/cast/types'

// Hono クライアントのモック
const mockGet = vi.fn()

vi.mock('@/libs/hono/client', () => ({
  castsClient: {
    api: {
      casts: {
        $get: mockGet,
      },
    },
  },
}))

// モック後にインポート
const { useCastList } = await import('@/features/cast/hooks/useCastList')

// テスト用のコンポーネント
function TestComponent({ page = 1, limit = 12 }: { page?: number; limit?: number }) {
  const query = useCastList({ page, limit })

  return (
    <div>
      <div data-testid="status">{query.status}</div>
      <div data-testid="isLoading">{String(query.isLoading)}</div>
      <div data-testid="isSuccess">{String(query.isSuccess)}</div>
      <div data-testid="isError">{String(query.isError)}</div>
      <div data-testid="error">{query.error?.message || 'none'}</div>
      <div data-testid="data">
        {query.data ? JSON.stringify(query.data) : 'none'}
      </div>
      <div data-testid="dataUpdatedAt">{query.dataUpdatedAt}</div>
      <button onClick={() => query.refetch()} data-testid="refetch-btn">
        Refetch
      </button>
    </div>
  )
}

// 各テストで新しい QueryClient を作成
let queryClient: QueryClient

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

/**
 * モックレスポンスを作成
 */
function createMockResponse(data: CastListResponse, ok = true) {
  return {
    ok,
    json: async () => ({
      success: ok,
      data: ok ? data : undefined,
      error: ok ? undefined : 'キャスト一覧の取得に失敗しました',
    }),
  }
}

describe('useCastList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  describe('成功時の動作', () => {
    it('初期状態でデータを取得できる', async () => {
      const mockData: CastListResponse = {
        casts: [
          {
            id: 'cast-1',
            name: 'テストキャスト',
            age: 25,
            bio: '自己紹介',
            rank: 1,
            areaName: '渋谷',
          },
        ],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
      }

      mockGet.mockResolvedValue(createMockResponse(mockData))

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      // ローディング状態を確認
      await expect.element(page.getByTestId('isLoading')).toHaveTextContent('true')
      await expect.element(page.getByTestId('status')).toHaveTextContent('pending')

      // 成功状態を確認
      await expect.element(page.getByTestId('isSuccess')).toHaveTextContent('true')
      await expect.element(page.getByTestId('status')).toHaveTextContent('success')

      // データが取得されたことを確認
      const dataElement = page.getByTestId('data')
      await expect.element(dataElement).not.toHaveTextContent('none')

      // API が正しいパラメータで呼ばれたか確認
      expect(mockGet).toHaveBeenCalledTimes(1)
      expect(mockGet).toHaveBeenCalledWith({
        query: { page: '1', limit: '12' },
      })
    })

    it('カスタムパラメータでデータを取得できる', async () => {
      const mockData: CastListResponse = {
        casts: [],
        total: 50,
        page: 2,
        limit: 20,
        totalPages: 3,
      }

      mockGet.mockResolvedValue(createMockResponse(mockData))

      render(
        <TestWrapper>
          <TestComponent page={2} limit={20} />
        </TestWrapper>
      )

      await expect.element(page.getByTestId('isSuccess')).toHaveTextContent('true')

      // API が正しいパラメータで呼ばれたか確認
      expect(mockGet).toHaveBeenCalledWith({
        query: { page: '2', limit: '20' },
      })
    })

    it('refetch でデータを再取得できる', async () => {
      const mockData: CastListResponse = {
        casts: [
          {
            id: 'cast-1',
            name: 'キャスト1',
            age: 25,
            bio: '自己紹介',
            rank: 1,
            areaName: '渋谷',
          },
        ],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
      }

      mockGet.mockResolvedValue(createMockResponse(mockData))

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await expect.element(page.getByTestId('isSuccess')).toHaveTextContent('true')

      // 初回の呼び出しを確認
      expect(mockGet).toHaveBeenCalledTimes(1)

      // refetch ボタンをクリック
      const refetchBtn = page.getByTestId('refetch-btn')
      await refetchBtn.click()

      // 2回目の呼び出しを確認
      await vi.waitFor(() => {
        expect(mockGet).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('API エラー時にエラーメッセージを返す', async () => {
      mockGet.mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'キャスト一覧の取得に失敗しました',
        }),
      })

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      // エラー状態を確認
      await expect.element(page.getByTestId('isError')).toHaveTextContent('true')
      await expect.element(page.getByTestId('status')).toHaveTextContent('error')

      // エラーメッセージを確認
      const errorElement = page.getByTestId('error')
      await expect.element(errorElement).toHaveTextContent('キャスト一覧の取得に失敗しました')
    })

    it('ネットワークエラー時にエラーメッセージを返す', async () => {
      mockGet.mockRejectedValue(new Error('Network error'))

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await expect.element(page.getByTestId('isError')).toHaveTextContent('true')
      await expect.element(page.getByTestId('error')).toHaveTextContent('Network error')
    })

    it('success が false の場合にエラーを返す', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          data: null,
        }),
      })

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await expect.element(page.getByTestId('isError')).toHaveTextContent('true')
      await expect.element(page.getByTestId('error')).toHaveTextContent(
        'キャスト一覧の取得に失敗しました'
      )
    })

    it('data が undefined の場合にエラーを返す', async () => {
      mockGet.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: undefined,
        }),
      })

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      await expect.element(page.getByTestId('isError')).toHaveTextContent('true')
    })
  })

  describe('クエリキーの生成', () => {
    it('page と limit に基づいて正しいパラメータで API を呼び出す', async () => {
      const mockData: CastListResponse = {
        casts: [],
        total: 0,
        page: 3,
        limit: 20,
        totalPages: 0,
      }

      mockGet.mockResolvedValue(createMockResponse(mockData))

      render(
        <TestWrapper>
          <TestComponent page={3} limit={20} />
        </TestWrapper>
      )

      await expect.element(page.getByTestId('isSuccess')).toHaveTextContent('true')

      // page と limit が正しく API に渡されることを確認
      expect(mockGet).toHaveBeenCalledWith({
        query: { page: '3', limit: '20' },
      })
    })
  })

  describe('デフォルトパラメータ', () => {
    it('パラメータを指定しない場合はデフォルト値を使用する', async () => {
      const mockData: CastListResponse = {
        casts: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
      }

      mockGet.mockResolvedValue(createMockResponse(mockData))

      // useCastList を引数なしで呼び出すコンポーネント
      function TestComponentNoParams() {
        const query = useCastList()

        return (
          <div>
            <div data-testid="status">{query.status}</div>
          </div>
        )
      }

      render(
        <TestWrapper>
          <TestComponentNoParams />
        </TestWrapper>
      )

      await expect.element(page.getByTestId('status')).toHaveTextContent('success')

      // デフォルトパラメータで呼ばれることを確認
      expect(mockGet).toHaveBeenCalledWith({
        query: { page: '1', limit: '12' },
      })
    })
  })
})
