/**
 * PhotoGallery コンポーネント統合テスト
 *
 * 写真ギャラリーの表示、削除機能を検証
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// next/imageのモック（テスト環境で動作させるため）
vi.mock('next/image', () => {
  const MockImage = ({
    src,
    alt,
  }: {
    src: string
    alt: string
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} />
  }
  MockImage.displayName = 'MockImage'
  return {
    default: MockImage,
    __esModule: true,
  }
})

// Hono クライアントのモック
const mockPhotosGet = vi.fn()
const mockPhotosDelete = vi.fn()

vi.mock('@/libs/hono/client', () => ({
  photosClient: {
    api: {
      casts: {
        photos: {
          ':castId': {
            $get: (...args: unknown[]) => mockPhotosGet(...args),
          },
          ':photoId': {
            $delete: (...args: unknown[]) => mockPhotosDelete(...args),
          },
        },
      },
    },
  },
}))

// モック後にインポート
const { PhotoGallery } = await import('@/features/cast-profile-photo/components/molecules/PhotoGallery')

// window.confirm のモック
const mockConfirm = vi.fn()
vi.stubGlobal('confirm', mockConfirm)

// window.alert のモック
const mockAlert = vi.fn()
vi.stubGlobal('alert', mockAlert)

/**
 * テスト用の QueryClient を作成
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

let queryClient: QueryClient

/**
 * テスト用のラッパーコンポーネント
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

/**
 * モック写真データ
 */
const mockPhotos = [
  {
    id: 'photo-1',
    castProfileId: 'cast-123',
    photoUrl: 'path/to/photo1.jpg',
    publicUrl: 'https://example.com/photo1.jpg',
    displayOrder: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'photo-2',
    castProfileId: 'cast-123',
    photoUrl: 'path/to/photo2.jpg',
    publicUrl: 'https://example.com/photo2.jpg',
    displayOrder: 1,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
]

describe('PhotoGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = createTestQueryClient()
  })

  describe('表示機能', () => {
    it('写真一覧を正常に表示できる', async () => {
      mockPhotosGet.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { photos: mockPhotos },
        }),
      })

      render(
        <TestWrapper>
          <PhotoGallery castId="cast-123" canDelete={false} />
        </TestWrapper>
      )

      // ローディング中
      await expect.element(page.getByText('読み込み中...')).toBeInTheDocument()

      // 写真が表示される
      await expect
        .element(page.getByAltText('プロフィール写真 1'))
        .toBeInTheDocument()
      await expect
        .element(page.getByAltText('プロフィール写真 2'))
        .toBeInTheDocument()
    })

    it('写真が0件の場合はメッセージを表示', async () => {
      mockPhotosGet.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { photos: [] },
        }),
      })

      render(
        <TestWrapper>
          <PhotoGallery castId="cast-123" canDelete={false} />
        </TestWrapper>
      )

      await expect
        .element(page.getByText('写真がまだ登録されていません'))
        .toBeInTheDocument()
    })

    it('エラー時はエラーメッセージを表示', async () => {
      mockPhotosGet.mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: '写真の読み込みに失敗しました',
        }),
      })

      render(
        <TestWrapper>
          <PhotoGallery castId="cast-123" canDelete={false} />
        </TestWrapper>
      )

      await expect
        .element(page.getByText('写真の読み込みに失敗しました'))
        .toBeInTheDocument()
    })
  })

  describe('削除機能', () => {
    it('canDelete=false の場合、削除ボタンは表示されない', async () => {
      mockPhotosGet.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { photos: mockPhotos },
        }),
      })

      render(
        <TestWrapper>
          <PhotoGallery castId="cast-123" canDelete={false} />
        </TestWrapper>
      )

      // 写真が表示されるまで待つ
      await expect
        .element(page.getByAltText('プロフィール写真 1'))
        .toBeInTheDocument()

      // 削除ボタンが存在しないことを確認
      const deleteButtons = page.getByRole('button', { name: '削除' })
      await expect.element(deleteButtons).not.toBeInTheDocument()
    })

    it('canDelete=true の場合、削除ボタンが表示される', async () => {
      mockPhotosGet.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { photos: mockPhotos },
        }),
      })

      render(
        <TestWrapper>
          <PhotoGallery castId="cast-123" canDelete={true} />
        </TestWrapper>
      )

      // 写真が表示されるまで待つ
      await expect
        .element(page.getByAltText('プロフィール写真 1'))
        .toBeInTheDocument()

      // 削除ボタンが表示されることを確認（2枚の写真それぞれに削除ボタン）
      const deleteButtons = page.getByRole('button', { name: '削除' })
      await expect.element(deleteButtons.first()).toBeInTheDocument()
    })

    it('削除ボタンをクリックすると確認ダイアログが表示される', async () => {
      mockPhotosGet.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { photos: mockPhotos },
        }),
      })

      mockConfirm.mockReturnValue(false) // キャンセル

      render(
        <TestWrapper>
          <PhotoGallery castId="cast-123" canDelete={true} />
        </TestWrapper>
      )

      // 写真が表示されるまで待つ
      await expect
        .element(page.getByAltText('プロフィール写真 1'))
        .toBeInTheDocument()

      // 最初の削除ボタンをクリック
      const deleteButtons = page.getByRole('button', { name: '削除' })
      await userEvent.click(deleteButtons.first().element())

      expect(mockConfirm).toHaveBeenCalledWith('この写真を削除しますか？')
    })

    it('確認ダイアログでOKを選択すると削除が実行される', async () => {
      mockPhotosGet.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { photos: mockPhotos },
        }),
      })

      mockPhotosDelete.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: null,
        }),
      })

      mockConfirm.mockReturnValue(true) // OK

      render(
        <TestWrapper>
          <PhotoGallery castId="cast-123" canDelete={true} />
        </TestWrapper>
      )

      // 写真が表示されるまで待つ
      await expect
        .element(page.getByAltText('プロフィール写真 1'))
        .toBeInTheDocument()

      // 最初の削除ボタンをクリック
      const deleteButtons = page.getByRole('button', { name: '削除' })
      await userEvent.click(deleteButtons.first().element())

      // 削除APIが呼ばれることを確認
      expect(mockPhotosDelete).toHaveBeenCalled()
    })

    it('削除失敗時はアラートを表示', async () => {
      mockPhotosGet.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { photos: mockPhotos },
        }),
      })

      mockPhotosDelete.mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: '権限がありません',
        }),
      })

      mockConfirm.mockReturnValue(true)

      render(
        <TestWrapper>
          <PhotoGallery castId="cast-123" canDelete={true} />
        </TestWrapper>
      )

      // 写真が表示されるまで待つ
      await expect
        .element(page.getByAltText('プロフィール写真 1'))
        .toBeInTheDocument()

      // 削除ボタンをクリック
      const deleteButtons = page.getByRole('button', { name: '削除' })
      await userEvent.click(deleteButtons.first().element())

      // エラーアラートが表示されることを確認（少し待つ）
      await vi.waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('権限がありません')
      })
    })
  })
})
