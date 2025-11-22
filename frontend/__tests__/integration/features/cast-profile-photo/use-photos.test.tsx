/**
 * 写真管理hooks統合テスト
 *
 * usePhotos, useUploadPhoto, useDeletePhoto の動作を検証
 * APIコールとキャッシュ管理をテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Hono クライアントのモック
const mockPhotosGet = vi.fn()
const mockPhotosPost = vi.fn()
const mockPhotosDelete = vi.fn()

vi.mock('@/libs/hono/client', () => ({
  photosClient: {
    api: {
      casts: {
        photos: {
          ':castId': {
            $get: (...args: unknown[]) => mockPhotosGet(...args),
          },
          $post: (...args: unknown[]) => mockPhotosPost(...args),
          ':photoId': {
            $delete: (...args: unknown[]) => mockPhotosDelete(...args),
          },
        },
      },
    },
  },
}))

// モック後にインポート
const { usePhotos } = await import('@/features/cast-profile-photo/hooks/usePhotos')
const { useUploadPhoto } = await import('@/features/cast-profile-photo/hooks/useUploadPhoto')
const { useDeletePhoto } = await import('@/features/cast-profile-photo/hooks/useDeletePhoto')

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
 * usePhotos テスト用コンポーネント
 */
function UsePhotosTestComponent({ castId }: { castId: string }) {
  const { data: photos, isLoading, error } = usePhotos(castId)

  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="error">{error?.message || 'none'}</div>
      <div data-testid="count">{photos?.length || 0}</div>
      {photos?.map((photo, index) => (
        <div key={photo.id} data-testid={`photo-${index}`}>
          {photo.id}
        </div>
      ))}
    </div>
  )
}

/**
 * useUploadPhoto テスト用コンポーネント
 */
function UseUploadPhotoTestComponent() {
  const uploadMutation = useUploadPhoto()

  const handleUpload = () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    uploadMutation.mutate(file)
  }

  return (
    <div>
      <div data-testid="isPending">{String(uploadMutation.isPending)}</div>
      <div data-testid="isSuccess">{String(uploadMutation.isSuccess)}</div>
      <div data-testid="error">{uploadMutation.error?.message || 'none'}</div>
      <button onClick={handleUpload} data-testid="upload-btn">
        Upload
      </button>
    </div>
  )
}

/**
 * useDeletePhoto テスト用コンポーネント
 */
function UseDeletePhotoTestComponent({ photoId }: { photoId: string }) {
  const deleteMutation = useDeletePhoto()

  const handleDelete = () => {
    deleteMutation.mutate(photoId)
  }

  return (
    <div>
      <div data-testid="isPending">{String(deleteMutation.isPending)}</div>
      <div data-testid="isSuccess">{String(deleteMutation.isSuccess)}</div>
      <div data-testid="error">{deleteMutation.error?.message || 'none'}</div>
      <button onClick={handleDelete} data-testid="delete-btn">
        Delete
      </button>
    </div>
  )
}

describe('写真管理hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = createTestQueryClient()
  })

  describe('usePhotos', () => {
    it('写真一覧を正常に取得できる', async () => {
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

      mockPhotosGet.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { photos: mockPhotos },
        }),
      })

      render(
        <TestWrapper>
          <UsePhotosTestComponent castId="cast-123" />
        </TestWrapper>
      )

      // ローディング状態
      await expect.element(page.getByTestId('loading')).toHaveTextContent('true')

      // データ取得完了
      await expect.element(page.getByTestId('loading')).toHaveTextContent('false')
      await expect.element(page.getByTestId('count')).toHaveTextContent('2')
      await expect.element(page.getByTestId('photo-0')).toHaveTextContent('photo-1')
      await expect.element(page.getByTestId('photo-1')).toHaveTextContent('photo-2')
    })

    it('写真が0件の場合は空配列を返す', async () => {
      mockPhotosGet.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { photos: [] },
        }),
      })

      render(
        <TestWrapper>
          <UsePhotosTestComponent castId="cast-123" />
        </TestWrapper>
      )

      await expect.element(page.getByTestId('loading')).toHaveTextContent('false')
      await expect.element(page.getByTestId('count')).toHaveTextContent('0')
    })

    it('APIエラー時はエラーメッセージを返す', async () => {
      mockPhotosGet.mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: '写真の取得に失敗しました',
        }),
      })

      render(
        <TestWrapper>
          <UsePhotosTestComponent castId="cast-123" />
        </TestWrapper>
      )

      await expect.element(page.getByTestId('error')).toHaveTextContent(
        '写真の取得に失敗しました'
      )
    })
  })

  describe('useUploadPhoto', () => {
    it('写真を正常にアップロードできる', async () => {
      const mockUploadedPhoto = {
        id: 'photo-new',
        castProfileId: 'cast-123',
        photoUrl: 'path/to/new-photo.jpg',
        publicUrl: 'https://example.com/new-photo.jpg',
        displayOrder: 2,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      }

      mockPhotosPost.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { photo: mockUploadedPhoto },
        }),
      })

      render(
        <TestWrapper>
          <UseUploadPhotoTestComponent />
        </TestWrapper>
      )

      await page.getByTestId('upload-btn').click()

      // 成功を待つ
      await expect.element(page.getByTestId('isSuccess')).toHaveTextContent('true')
      await expect.element(page.getByTestId('error')).toHaveTextContent('none')
      expect(mockPhotosPost).toHaveBeenCalled()
    })

    it('アップロード失敗時はエラーメッセージを返す', async () => {
      mockPhotosPost.mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'ファイルサイズが大きすぎます',
        }),
      })

      render(
        <TestWrapper>
          <UseUploadPhotoTestComponent />
        </TestWrapper>
      )

      await page.getByTestId('upload-btn').click()

      await expect.element(page.getByTestId('error')).toHaveTextContent(
        'ファイルサイズが大きすぎます'
      )
    })
  })

  describe('useDeletePhoto', () => {
    it('写真を正常に削除できる', async () => {
      mockPhotosDelete.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: null,
        }),
      })

      render(
        <TestWrapper>
          <UseDeletePhotoTestComponent photoId="photo-1" />
        </TestWrapper>
      )

      await page.getByTestId('delete-btn').click()

      // 成功を待つ
      await expect.element(page.getByTestId('isSuccess')).toHaveTextContent('true')
      await expect.element(page.getByTestId('error')).toHaveTextContent('none')
      expect(mockPhotosDelete).toHaveBeenCalled()
    })

    it('削除失敗時はエラーメッセージを返す', async () => {
      mockPhotosDelete.mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: '写真が見つかりません',
        }),
      })

      render(
        <TestWrapper>
          <UseDeletePhotoTestComponent photoId="photo-1" />
        </TestWrapper>
      )

      await page.getByTestId('delete-btn').click()

      await expect.element(page.getByTestId('error')).toHaveTextContent(
        '写真が見つかりません'
      )
    })
  })
})
