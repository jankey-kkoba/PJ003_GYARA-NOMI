/**
 * HomeTemplate Integration テスト
 *
 * ホームページテンプレートのテスト
 * マッチング状況一覧の表示、ローディング、エラーハンドリングを検証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'
import { HomeTemplate } from '@/features/home/components/templates/HomeTemplate'
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
]

// 認証済みセッション（ゲストユーザー）
const authenticatedSession: Session = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    role: 'guest',
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
}

let queryClient: QueryClient

/**
 * テストコンポーネントをラップ
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider session={authenticatedSession} refetchInterval={0}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  )
}

describe('HomeTemplate', () => {
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

  describe('基本表示', () => {
    it('ページタイトルとキャスト一覧リンクが表示される', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, soloMatchings: [] }),
      })

      render(<HomeTemplate />, { wrapper: TestWrapper })

      // タイトルが表示されることを確認
      await expect.element(page.getByText('ギャラ飲みプラットフォーム')).toBeInTheDocument()

      // キャスト一覧リンクが表示されることを確認
      await expect.element(page.getByRole('link', { name: 'キャスト一覧を見る' })).toBeInTheDocument()
    })

    it('マッチング状況セクションが表示される', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, soloMatchings: [] }),
      })

      render(<HomeTemplate />, { wrapper: TestWrapper })

      // マッチング状況セクションのタイトルが表示されることを確認
      await expect.element(page.getByText('マッチング状況')).toBeInTheDocument()
    })
  })

  describe('マッチング状況の表示', () => {
    it('マッチングがある場合、マッチング一覧が表示される', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, soloMatchings: mockMatchings }),
      })

      render(<HomeTemplate />, { wrapper: TestWrapper })

      // マッチングカードが表示されることを確認
      await expect.element(page.getByText('回答待ち')).toBeInTheDocument()
      await expect.element(page.getByText('渋谷駅周辺')).toBeInTheDocument()
      await expect.element(page.getByText('10,000ポイント')).toBeInTheDocument()
    })

    it('マッチングが0件の場合、メッセージが表示される', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, soloMatchings: [] }),
      })

      render(<HomeTemplate />, { wrapper: TestWrapper })

      // 「マッチングはありません」メッセージが表示されることを確認
      await expect.element(page.getByText('マッチングはありません')).toBeInTheDocument()
    })

    it('APIエラーの場合、エラーメッセージが表示される', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'サーバーエラー' }),
      })

      render(<HomeTemplate />, { wrapper: TestWrapper })

      // エラーメッセージが表示されることを確認
      await expect.element(page.getByText('サーバーエラー')).toBeInTheDocument()
    })
  })
})
