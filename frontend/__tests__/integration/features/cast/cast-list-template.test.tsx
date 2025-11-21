/**
 * CastListTemplate コンポーネント統合テスト
 *
 * Testing Trophy の Integration テストとして、
 * データ取得、レンダリング、ローディング状態、エラー状態、ページネーションを検証する
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { CastListResponse } from '@/features/cast/types'

// Hono クライアントのモック
const mockGet = vi.fn()
const mockFavoriteGet = vi.fn()

vi.mock('@/libs/hono/client', () => ({
  castsClient: {
    api: {
      casts: {
        $get: mockGet,
      },
    },
  },
  favoritesClient: {
    api: {
      favorites: {
        ':castId': {
          $get: mockFavoriteGet,
          $post: vi.fn(),
          $delete: vi.fn(),
        },
      },
    },
  },
}))

// モック後にインポート
const { CastListTemplate } = await import('@/features/cast/components/organisms/CastListTemplate')

/**
 * テスト用の QueryClient を作成
 * エラーログを抑制し、リトライを無効化
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

// 各テストで新しい QueryClient を作成するための変数
let queryClient: QueryClient

/**
 * テスト用のラッパーコンポーネント
 */
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
      error: ok ? undefined : 'エラーが発生しました',
    }),
  }
}

describe('CastListTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 各テストで新しい QueryClient を作成してキャッシュをクリア
    queryClient = createTestQueryClient()
    // お気に入り状態のデフォルトモック
    mockFavoriteGet.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { isFavorite: false } }),
    })
  })

  describe('ローディング状態', () => {
    it('データ取得中はローディング表示を行う', async () => {
      // 遅延するPromiseでローディング状態を再現
      mockGet.mockImplementation(() => new Promise(() => {}))

      render(
        <TestWrapper>
          <CastListTemplate />
        </TestWrapper>
      )

      await expect.element(page.getByText('読み込み中...')).toBeInTheDocument()
    })
  })

  describe('エラー状態', () => {
    it('API エラー時はエラーメッセージを表示する', async () => {
      mockGet.mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'キャスト一覧の取得に失敗しました',
        }),
      })

      render(
        <TestWrapper>
          <CastListTemplate />
        </TestWrapper>
      )

      await expect.element(page.getByText(/エラーが発生しました/)).toBeInTheDocument()
    })

    it('ネットワークエラー時はエラーメッセージを表示する', async () => {
      mockGet.mockRejectedValue(new Error('Network error'))

      render(
        <TestWrapper>
          <CastListTemplate />
        </TestWrapper>
      )

      await expect.element(page.getByText(/エラーが発生しました/)).toBeInTheDocument()
    })
  })

  describe('空の状態', () => {
    it('キャストが0件の場合は空メッセージを表示する', async () => {
      const mockData: CastListResponse = {
        casts: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
      }

      mockGet.mockResolvedValue(createMockResponse(mockData))

      render(
        <TestWrapper>
          <CastListTemplate />
        </TestWrapper>
      )

      await expect.element(page.getByText('キャストが見つかりませんでした')).toBeInTheDocument()
    })
  })

  describe('キャスト一覧の表示', () => {
    it('キャストカードを正しく表示する', async () => {
      const mockData: CastListResponse = {
        casts: [
          {
            id: 'cast-1',
            name: 'テストキャスト1',
            age: 25,
            bio: '自己紹介1',
            rank: 1,
            areaName: '渋谷',
          },
          {
            id: 'cast-2',
            name: 'テストキャスト2',
            age: 28,
            bio: '自己紹介2',
            rank: 2,
            areaName: '新宿',
          },
        ],
        total: 2,
        page: 1,
        limit: 12,
        totalPages: 1,
      }

      mockGet.mockResolvedValue(createMockResponse(mockData))

      render(
        <TestWrapper>
          <CastListTemplate />
        </TestWrapper>
      )

      // 名前は7文字制限で省略表示される（2つのキャストがいるため.first()を使用）
      await expect.element(page.getByText('テストキャスト...').first()).toBeInTheDocument()
      await expect.element(page.getByText('25歳')).toBeInTheDocument()
      await expect.element(page.getByText('28歳')).toBeInTheDocument()
    })

    it('複数のキャストを表示する', async () => {
      const mockCasts = Array.from({ length: 12 }, (_, i) => ({
        id: `cast-${String(i + 1).padStart(3, '0')}`,
        name: `キャスト${String(i + 1).padStart(3, '0')}`,
        age: 20 + i,
        bio: `自己紹介${String(i + 1).padStart(3, '0')}`,
        rank: i + 1,
        areaName: 'エリア',
      }))

      const mockData: CastListResponse = {
        casts: mockCasts,
        total: 12,
        page: 1,
        limit: 12,
        totalPages: 1,
      }

      mockGet.mockResolvedValue(createMockResponse(mockData))

      render(
        <TestWrapper>
          <CastListTemplate />
        </TestWrapper>
      )

      // 最初と最後のキャストが表示されていることを確認
      await expect.element(page.getByText('キャスト001')).toBeInTheDocument()
      await expect.element(page.getByText('キャスト012')).toBeInTheDocument()
    })
  })

  describe('ページネーション', () => {
    it('ページネーションを表示する', async () => {
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
        total: 25,
        page: 1,
        limit: 12,
        totalPages: 3,
      }

      mockGet.mockResolvedValue(createMockResponse(mockData))

      render(
        <TestWrapper>
          <CastListTemplate />
        </TestWrapper>
      )

      await expect.element(page.getByText('キャスト1')).toBeInTheDocument()

      // ページネーションボタンが存在することを確認
      await expect.element(page.getByRole('navigation')).toBeInTheDocument()
    })

    it('ページ変更時に新しいデータを取得する', async () => {
      // 1ページ目のデータ
      const mockDataPage1: CastListResponse = {
        casts: [
          {
            id: 'cast-1',
            name: 'キャスト1',
            age: 25,
            bio: '自己紹介1',
            rank: 1,
            areaName: '渋谷',
          },
        ],
        total: 25,
        page: 1,
        limit: 12,
        totalPages: 3,
      }

      // 2ページ目のデータ
      const mockDataPage2: CastListResponse = {
        casts: [
          {
            id: 'cast-13',
            name: 'キャスト13',
            age: 30,
            bio: '自己紹介13',
            rank: 13,
            areaName: '新宿',
          },
        ],
        total: 25,
        page: 2,
        limit: 12,
        totalPages: 3,
      }

      // 最初は1ページ目を返す
      mockGet.mockResolvedValueOnce(createMockResponse(mockDataPage1))

      render(
        <TestWrapper>
          <CastListTemplate />
        </TestWrapper>
      )

      // 1ページ目が表示されることを確認
      await expect.element(page.getByText('キャスト1')).toBeInTheDocument()

      // 2ページ目のレスポンスを設定
      mockGet.mockResolvedValueOnce(createMockResponse(mockDataPage2))

      // 2ページ目のボタンをクリック（ページネーション内の'2'リンクのみを選択）
      const paginationNav = page.getByRole('navigation')
      const page2Button = paginationNav.getByRole('link', { name: '2', exact: true })
      await page2Button.click()

      // 2ページ目が表示されることを確認
      await expect.element(page.getByText('キャスト13')).toBeInTheDocument()

      // API が正しいページ番号で呼ばれたか確認
      expect(mockGet).toHaveBeenCalledTimes(2)
      expect(mockGet).toHaveBeenNthCalledWith(2, {
        query: { page: '2', limit: '12' },
      })
    })

    it('総ページ数が1の場合はページネーションを表示しない', async () => {
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
        total: 5,
        page: 1,
        limit: 12,
        totalPages: 1,
      }

      mockGet.mockResolvedValue(createMockResponse(mockData))

      render(
        <TestWrapper>
          <CastListTemplate />
        </TestWrapper>
      )

      await expect.element(page.getByText('キャスト1')).toBeInTheDocument()

      // ページネーションのnavigationが存在しないことを確認
      const navigation = page.getByRole('navigation')
      await expect.element(navigation).not.toBeInTheDocument()
    })
  })

  describe('データ取得', () => {
    it('初回レンダリング時にデータを取得する', async () => {
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
          <CastListTemplate />
        </TestWrapper>
      )

      await expect.element(page.getByText('キャスト1')).toBeInTheDocument()

      // API が呼ばれたことを確認
      expect(mockGet).toHaveBeenCalledTimes(1)
      expect(mockGet).toHaveBeenCalledWith({
        query: { page: '1', limit: '12' },
      })
    })
  })

  describe('フィルター機能', () => {
    it('絞り込みボタンが表示される', async () => {
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
          <CastListTemplate />
        </TestWrapper>
      )

      await expect
        .element(page.getByRole('button', { name: /絞り込み/ }))
        .toBeInTheDocument()
    })

    it('年齢フィルターを適用するとAPIが再取得される', async () => {
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

      const filteredData: CastListResponse = {
        casts: [
          {
            id: 'cast-2',
            name: 'フィルター後',
            age: 22,
            bio: '自己紹介2',
            rank: 2,
            areaName: '新宿',
          },
        ],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
      }

      mockGet.mockResolvedValueOnce(createMockResponse(mockData))

      render(
        <TestWrapper>
          <CastListTemplate />
        </TestWrapper>
      )

      // 初期表示を待つ
      await expect.element(page.getByText('キャスト1')).toBeInTheDocument()

      // フィルター後のレスポンスを設定
      mockGet.mockResolvedValueOnce(createMockResponse(filteredData))

      // 絞り込みダイアログを開く
      await page.getByRole('button', { name: /絞り込み/ }).click()

      // 年齢を入力
      const minAgeInput = page.getByPlaceholder('18')
      const maxAgeInput = page.getByPlaceholder('99')
      await userEvent.clear(minAgeInput)
      await userEvent.type(minAgeInput, '20')
      await userEvent.clear(maxAgeInput)
      await userEvent.type(maxAgeInput, '25')

      // 適用
      await page.getByRole('button', { name: '適用' }).click()

      // フィルター後のデータが表示される
      await expect.element(page.getByText('フィルター後')).toBeInTheDocument()

      // APIがフィルターパラメータ付きで呼ばれる
      expect(mockGet).toHaveBeenLastCalledWith({
        query: { page: '1', limit: '12', minAge: '20', maxAge: '25' },
      })
    })

    it('フィルターリセット時にフィルターなしで再取得される', async () => {
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
          <CastListTemplate />
        </TestWrapper>
      )

      await expect.element(page.getByText('キャスト1')).toBeInTheDocument()

      // フィルターを適用
      await page.getByRole('button', { name: /絞り込み/ }).click()
      const minAgeInput = page.getByPlaceholder('18')
      await userEvent.clear(minAgeInput)
      await userEvent.type(minAgeInput, '20')
      await page.getByRole('button', { name: '適用' }).click()

      // リセット
      await page.getByRole('button', { name: /絞り込み/ }).click()
      await page.getByRole('button', { name: /リセット/ }).click()

      // フィルターなしで呼ばれる
      await vi.waitFor(() => {
        const lastCall = mockGet.mock.calls[mockGet.mock.calls.length - 1]
        expect(lastCall).toEqual([{ query: { page: '1', limit: '12' } }])
      })
    })
  })
})
