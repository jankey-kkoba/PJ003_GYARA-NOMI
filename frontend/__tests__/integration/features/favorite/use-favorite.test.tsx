/**
 * useFavorite hooks 統合テスト
 *
 * お気に入り状態取得、追加、削除のフック動作を検証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Hono クライアントのモック
const mockGet = vi.fn()
const mockPost = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/libs/hono/client', () => ({
  favoritesClient: {
    api: {
      favorites: {
        ':castId': {
          $get: mockGet,
          $post: mockPost,
          $delete: mockDelete,
        },
      },
    },
  },
}))

// モック後にインポート
const { useFavoriteStatus, useAddFavorite, useRemoveFavorite } = await import(
  '@/features/favorite/hooks/useFavorite'
)

// テスト用コンポーネント
function TestStatusComponent({ castId }: { castId: string }) {
  const query = useFavoriteStatus(castId)

  return (
    <div>
      <div data-testid="status">{query.status}</div>
      <div data-testid="isLoading">{String(query.isLoading)}</div>
      <div data-testid="isFavorite">{String(query.data ?? 'undefined')}</div>
      <div data-testid="error">{query.error?.message ?? 'none'}</div>
    </div>
  )
}

function TestMutationComponent({ castId }: { castId: string }) {
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()

  return (
    <div>
      <div data-testid="add-pending">{String(addFavorite.isPending)}</div>
      <div data-testid="remove-pending">{String(removeFavorite.isPending)}</div>
      <div data-testid="add-error">{addFavorite.error?.message ?? 'none'}</div>
      <div data-testid="remove-error">
        {removeFavorite.error?.message ?? 'none'}
      </div>
      <button
        data-testid="add-btn"
        onClick={() => addFavorite.mutate(castId)}
      >
        追加
      </button>
      <button
        data-testid="remove-btn"
        onClick={() => removeFavorite.mutate(castId)}
      >
        削除
      </button>
    </div>
  )
}

let queryClient: QueryClient

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useFavoriteStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it('お気に入り状態を取得できる（登録済み）', async () => {
    mockGet.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { isFavorite: true } }),
    })

    render(
      <TestWrapper>
        <TestStatusComponent castId="cast-123" />
      </TestWrapper>
    )

    await expect.element(page.getByTestId('status')).toHaveTextContent('success')
    await expect.element(page.getByTestId('isFavorite')).toHaveTextContent('true')

    expect(mockGet).toHaveBeenCalledWith({ param: { castId: 'cast-123' } })
  })

  it('お気に入り状態を取得できる（未登録）', async () => {
    mockGet.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { isFavorite: false } }),
    })

    render(
      <TestWrapper>
        <TestStatusComponent castId="cast-456" />
      </TestWrapper>
    )

    await expect.element(page.getByTestId('isFavorite')).toHaveTextContent('false')
  })

  it('APIエラー時にエラーを返す', async () => {
    mockGet.mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    })

    render(
      <TestWrapper>
        <TestStatusComponent castId="cast-789" />
      </TestWrapper>
    )

    await expect.element(page.getByTestId('status')).toHaveTextContent('error')
    await expect
      .element(page.getByTestId('error'))
      .toHaveTextContent('お気に入り状態の取得に失敗しました')
  })

  it('castIdが空の場合はクエリを実行しない', async () => {
    render(
      <TestWrapper>
        <TestStatusComponent castId="" />
      </TestWrapper>
    )

    // クエリが実行されないのでpending状態のまま
    await expect.element(page.getByTestId('status')).toHaveTextContent('pending')
    expect(mockGet).not.toHaveBeenCalled()
  })
})

describe('useAddFavorite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it('お気に入りを追加できる', async () => {
    mockPost.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { isFavorite: true } }),
    })

    render(
      <TestWrapper>
        <TestMutationComponent castId="cast-123" />
      </TestWrapper>
    )

    const addBtn = page.getByTestId('add-btn')
    await addBtn.click()

    await expect.element(page.getByTestId('add-pending')).toHaveTextContent('false')
    expect(mockPost).toHaveBeenCalledWith({ param: { castId: 'cast-123' } })
  })

  it('追加中はisPendingがtrueになる', async () => {
    mockPost.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(
      <TestWrapper>
        <TestMutationComponent castId="cast-123" />
      </TestWrapper>
    )

    const addBtn = page.getByTestId('add-btn')
    await addBtn.click()

    await expect.element(page.getByTestId('add-pending')).toHaveTextContent('true')
  })

  it('追加失敗時にエラーを返す', async () => {
    mockPost.mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    })

    render(
      <TestWrapper>
        <TestMutationComponent castId="cast-123" />
      </TestWrapper>
    )

    const addBtn = page.getByTestId('add-btn')
    await addBtn.click()

    await expect
      .element(page.getByTestId('add-error'))
      .toHaveTextContent('お気に入りの追加に失敗しました')
  })
})

describe('useRemoveFavorite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it('お気に入りを削除できる', async () => {
    mockDelete.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { isFavorite: false } }),
    })

    render(
      <TestWrapper>
        <TestMutationComponent castId="cast-123" />
      </TestWrapper>
    )

    const removeBtn = page.getByTestId('remove-btn')
    await removeBtn.click()

    await expect.element(page.getByTestId('remove-pending')).toHaveTextContent('false')
    expect(mockDelete).toHaveBeenCalledWith({ param: { castId: 'cast-123' } })
  })

  it('削除失敗時にエラーを返す', async () => {
    mockDelete.mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    })

    render(
      <TestWrapper>
        <TestMutationComponent castId="cast-123" />
      </TestWrapper>
    )

    const removeBtn = page.getByTestId('remove-btn')
    await removeBtn.click()

    await expect
      .element(page.getByTestId('remove-error'))
      .toHaveTextContent('お気に入りの削除に失敗しました')
  })
})

describe('キャッシュ更新', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it('追加成功時にキャッシュがtrueに更新される', async () => {
    // 初期状態: false
    mockGet.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { isFavorite: false } }),
    })
    mockPost.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { isFavorite: true } }),
    })

    // 両方のコンポーネントを同時にレンダリング
    function CombinedComponent() {
      const status = useFavoriteStatus('cast-123')
      const addFavorite = useAddFavorite()

      return (
        <div>
          <div data-testid="isFavorite">{String(status.data ?? 'undefined')}</div>
          <button data-testid="add-btn" onClick={() => addFavorite.mutate('cast-123')}>
            追加
          </button>
        </div>
      )
    }

    render(
      <TestWrapper>
        <CombinedComponent />
      </TestWrapper>
    )

    // 初期状態を確認
    await expect.element(page.getByTestId('isFavorite')).toHaveTextContent('false')

    // 追加
    await page.getByTestId('add-btn').click()

    // キャッシュがtrueに更新される
    await expect.element(page.getByTestId('isFavorite')).toHaveTextContent('true')
  })

  it('削除成功時にキャッシュがfalseに更新される', async () => {
    // 初期状態: true
    mockGet.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { isFavorite: true } }),
    })
    mockDelete.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { isFavorite: false } }),
    })

    function CombinedComponent() {
      const status = useFavoriteStatus('cast-123')
      const removeFavorite = useRemoveFavorite()

      return (
        <div>
          <div data-testid="isFavorite">{String(status.data ?? 'undefined')}</div>
          <button
            data-testid="remove-btn"
            onClick={() => removeFavorite.mutate('cast-123')}
          >
            削除
          </button>
        </div>
      )
    }

    render(
      <TestWrapper>
        <CombinedComponent />
      </TestWrapper>
    )

    // 初期状態を確認
    await expect.element(page.getByTestId('isFavorite')).toHaveTextContent('true')

    // 削除
    await page.getByTestId('remove-btn').click()

    // キャッシュがfalseに更新される
    await expect.element(page.getByTestId('isFavorite')).toHaveTextContent('false')
  })
})
