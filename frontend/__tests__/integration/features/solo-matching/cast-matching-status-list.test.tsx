/**
 * CastMatchingStatusList Integration テスト
 *
 * キャストのマッチング状況一覧コンポーネントのテスト
 * React Query、API統合、ローディング、エラーハンドリングを検証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CastMatchingStatusList } from '@/features/solo-matching/components/organisms/CastMatchingStatusList'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'

// グローバルfetchのモック
const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

/**
 * テスト用のマッチングデータ
 */
const mockMatchings: SoloMatching[] = [
  {
    id: 'matching-1',
    guestId: 'guest-1',
    castId: 'cast-1',
    chatRoomId: null,
    status: 'pending',
    proposedDate: new Date('2025-12-01T19:00:00Z'),
    proposedDuration: 120,
    proposedLocation: '渋谷駅周辺',
    hourlyRate: 5000,
    totalPoints: 10000,
    startedAt: null,
    scheduledEndAt: null,
    actualEndAt: null,
    extensionMinutes: 0,
    extensionPoints: 0,
    castRespondedAt: null,
    createdAt: new Date('2025-11-24T10:00:00Z'),
    updatedAt: new Date('2025-11-24T10:00:00Z'),
  },
  {
    id: 'matching-2',
    guestId: 'guest-2',
    castId: 'cast-1',
    chatRoomId: null,
    status: 'accepted',
    proposedDate: new Date('2025-12-02T20:00:00Z'),
    proposedDuration: 90,
    proposedLocation: '新宿駅周辺',
    hourlyRate: 6000,
    totalPoints: 9000,
    startedAt: null,
    scheduledEndAt: null,
    actualEndAt: null,
    extensionMinutes: 0,
    extensionPoints: 0,
    castRespondedAt: new Date('2025-11-24T11:00:00Z'),
    createdAt: new Date('2025-11-24T11:00:00Z'),
    updatedAt: new Date('2025-11-24T11:00:00Z'),
  },
]

let queryClient: QueryClient

/**
 * テストコンポーネントをラップ
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('CastMatchingStatusList', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })
    vi.clearAllMocks()
  })

  describe('ローディング状態', () => {
    it('データ取得中から完了までの遷移を確認する', async () => {
      // fetchを遅延させる
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ success: true, soloMatchings: [] }),
              })
            }, 1000)
          )
      )

      render(<CastMatchingStatusList />, { wrapper: TestWrapper })

      // ローディングメッセージが表示されることを確認
      await expect.element(page.getByText('マッチング状況を読み込み中...')).toBeInTheDocument()

      // データ取得完了後、「マッチングはありません」が表示されることを確認
      await expect.element(page.getByText('マッチングはありません')).toBeInTheDocument()
    })
  })

  describe('正常系', () => {
    it('マッチング一覧を表示する', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, soloMatchings: mockMatchings }),
      })

      render(<CastMatchingStatusList />, { wrapper: TestWrapper })

      // マッチングカードが表示されることを確認
      await expect.element(page.getByText('回答待ち')).toBeInTheDocument()
      await expect.element(page.getByText('成立')).toBeInTheDocument()

      // 場所が表示されることを確認
      await expect.element(page.getByText('渋谷駅周辺')).toBeInTheDocument()
      await expect.element(page.getByText('新宿駅周辺')).toBeInTheDocument()

      // 合計ポイントが表示されることを確認
      await expect.element(page.getByText('10,000ポイント')).toBeInTheDocument()
      await expect.element(page.getByText('9,000ポイント')).toBeInTheDocument()
    })

    it('マッチングが0件の場合はメッセージを表示する', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, soloMatchings: [] }),
      })

      render(<CastMatchingStatusList />, { wrapper: TestWrapper })

      // 「マッチングはありません」メッセージが表示されることを確認
      await expect.element(page.getByText('マッチングはありません')).toBeInTheDocument()
    })
  })

  describe('ボタン操作', () => {
    it('accepted状態のマッチングに「合流」ボタンが表示される', async () => {
      const acceptedMatching: SoloMatching = {
        ...mockMatchings[1],
        status: 'accepted',
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, soloMatchings: [acceptedMatching] }),
      })

      render(<CastMatchingStatusList />, { wrapper: TestWrapper })

      // 「合流」ボタンが表示されることを確認
      await expect.element(page.getByRole('button', { name: '合流' })).toBeInTheDocument()
    })

    it('「合流」ボタンをクリックするとAPI呼び出しが実行される', async () => {
      const acceptedMatching: SoloMatching = {
        ...mockMatchings[1],
        status: 'accepted',
      }

      // 初回: 一覧取得
      // 2回目: 合流API
      // 3回目: 一覧再取得
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, soloMatchings: [acceptedMatching] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            matching: { ...acceptedMatching, status: 'in_progress' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            soloMatchings: [{ ...acceptedMatching, status: 'in_progress' }],
          }),
        })

      render(<CastMatchingStatusList />, { wrapper: TestWrapper })

      // 「合流」ボタンをクリック
      const startButton = page.getByRole('button', { name: '合流' })
      await startButton.click()

      // API呼び出しが実行されたことを確認
      // 1回目: 一覧取得、2回目: 合流API、3回目: 一覧再取得
      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(3)
      })

      // 合流APIのURLが正しいことを確認
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        '/api/solo-matchings/cast/matching-2/start',
        expect.objectContaining({
          method: 'PATCH',
        })
      )

      // ステータスが更新されたことを確認
      await expect.element(page.getByText('ギャラ飲み中')).toBeInTheDocument()
    })

    it('pending状態のマッチングに「承認」「拒否」ボタンが表示される', async () => {
      const pendingMatching: SoloMatching = {
        ...mockMatchings[0],
        status: 'pending',
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, soloMatchings: [pendingMatching] }),
      })

      render(<CastMatchingStatusList />, { wrapper: TestWrapper })

      // 「承認」「拒否」ボタンが表示されることを確認
      await expect.element(page.getByRole('button', { name: '承認' })).toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: '拒否' })).toBeInTheDocument()
    })
  })

  describe('エラーハンドリング', () => {
    it('APIエラーの場合はエラーメッセージを表示する', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'サーバーエラー' }),
      })

      render(<CastMatchingStatusList />, { wrapper: TestWrapper })

      // エラーメッセージが表示されることを確認
      await expect.element(page.getByText('サーバーエラー')).toBeInTheDocument()
    })

    it('ネットワークエラーの場合はエラーメッセージを表示する', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<CastMatchingStatusList />, { wrapper: TestWrapper })

      // エラーメッセージが表示されることを確認
      await expect.element(page.getByText('Network error')).toBeInTheDocument()
    })

    it('「合流」ボタンクリック時のエラーハンドリング', async () => {
      const acceptedMatching: SoloMatching = {
        ...mockMatchings[1],
        status: 'accepted',
      }

      // 初回: 一覧取得成功
      // 2回目: 合流API失敗
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, soloMatchings: [acceptedMatching] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ success: false, error: 'マッチングの開始に失敗しました' }),
        })

      render(<CastMatchingStatusList />, { wrapper: TestWrapper })

      // 「合流」ボタンをクリック
      const startButton = page.getByRole('button', { name: '合流' })
      await startButton.click()

      // エラーメッセージが表示されることを確認
      await expect
        .element(page.getByText('マッチングの開始に失敗しました'))
        .toBeInTheDocument()
    })
  })
})
