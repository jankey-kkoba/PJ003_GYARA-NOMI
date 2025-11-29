/**
 * MatchingStatusList Integration テスト
 *
 * マッチング状況一覧コンポーネントのテスト
 * React Query、API統合、ローディング、エラーハンドリングを検証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MatchingStatusList } from '@/features/solo-matching/components/organisms/MatchingStatusList'
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
		guestId: 'guest-1',
		castId: 'cast-2',
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
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}

describe('MatchingStatusList', () => {
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
			let resolveFetch: (value: unknown) => void
			const fetchPromise = new Promise((resolve) => {
				resolveFetch = resolve
			})

			// fetchを遅延させる
			mockFetch.mockReturnValue(fetchPromise)

			render(<MatchingStatusList />, { wrapper: TestWrapper })

			// ローディングメッセージが表示されることを確認
			await expect
				.element(page.getByText('マッチング状況を読み込み中...'))
				.toBeInTheDocument()

			// fetchを解決
			resolveFetch!({
				ok: true,
				json: async () => ({ success: true, soloMatchings: [] }),
			})

			// データ取得完了後、「マッチングはありません」が表示されることを確認
			await expect
				.element(page.getByText('マッチングはありません'))
				.toBeInTheDocument()
		})
	})

	describe('正常系', () => {
		it('マッチング一覧を表示する', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ success: true, soloMatchings: mockMatchings }),
			})

			render(<MatchingStatusList />, { wrapper: TestWrapper })

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

			render(<MatchingStatusList />, { wrapper: TestWrapper })

			// 「マッチングはありません」メッセージが表示されることを確認
			await expect
				.element(page.getByText('マッチングはありません'))
				.toBeInTheDocument()
		})
	})

	describe('エラーハンドリング', () => {
		it('APIエラーの場合はエラーメッセージを表示する', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				json: async () => ({ success: false, error: 'サーバーエラー' }),
			})

			render(<MatchingStatusList />, { wrapper: TestWrapper })

			// エラーメッセージが表示されることを確認
			await expect.element(page.getByText('サーバーエラー')).toBeInTheDocument()
		})

		it('ネットワークエラーの場合はエラーメッセージを表示する', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'))

			render(<MatchingStatusList />, { wrapper: TestWrapper })

			// エラーメッセージが表示されることを確認
			await expect.element(page.getByText('Network error')).toBeInTheDocument()
		})
	})
})
