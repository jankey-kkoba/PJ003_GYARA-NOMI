/**
 * MatchingStatusList Integration テスト
 *
 * マッチング状況一覧コンポーネントのテスト
 * ソロマッチングとグループマッチングの両方を表示
 * React Query、API統合、ローディング、エラーハンドリングを検証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MatchingStatusList } from '@/features/solo-matching/components/organisms/MatchingStatusList'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'
import type { GuestGroupMatching } from '@/features/group-matching/types/groupMatching'

// グローバルfetchのモック
const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

/**
 * テスト用のソロマッチングデータ
 */
const mockSoloMatchings: SoloMatching[] = [
	{
		id: 'matching-1',
		guestId: 'guest-1',
		castId: 'cast-1',
		chatRoomId: null,
		status: 'pending',
		proposedDate: '2025-12-01T19:00:00.000Z',
		proposedDuration: 120,
		proposedLocation: '渋谷駅周辺',
		totalPoints: 10000,
		startedAt: null,
		scheduledEndAt: null,
		actualEndAt: null,
		extensionMinutes: 0,
		extensionPoints: 0,
		castRespondedAt: null,
		createdAt: '2025-11-24T10:00:00.000Z',
		updatedAt: '2025-11-24T10:00:00.000Z',
	},
	{
		id: 'matching-2',
		guestId: 'guest-1',
		castId: 'cast-2',
		chatRoomId: null,
		status: 'accepted',
		proposedDate: '2025-12-02T20:00:00.000Z',
		proposedDuration: 90,
		proposedLocation: '新宿駅周辺',
		totalPoints: 9000,
		startedAt: null,
		scheduledEndAt: null,
		actualEndAt: null,
		extensionMinutes: 0,
		extensionPoints: 0,
		castRespondedAt: '2025-11-24T11:00:00.000Z',
		createdAt: '2025-11-24T11:00:00.000Z',
		updatedAt: '2025-11-24T11:00:00.000Z',
	},
]

/**
 * テスト用のグループマッチングデータ
 */
const mockGroupMatchings: GuestGroupMatching[] = [
	{
		id: 'group-matching-1',
		guestId: 'guest-1',
		chatRoomId: null,
		status: 'pending',
		proposedDate: '2025-12-03T18:00:00.000Z',
		proposedDuration: 180,
		proposedLocation: '六本木',
		totalPoints: 27000,
		startedAt: null,
		scheduledEndAt: null,
		actualEndAt: null,
		extensionMinutes: 0,
		extensionPoints: 0,
		recruitingEndedAt: null,
		requestedCastCount: 3,
		createdAt: '2025-11-24T12:00:00.000Z',
		updatedAt: '2025-11-24T12:00:00.000Z',
		type: 'group',
		participantSummary: {
			pendingCount: 2,
			acceptedCount: 1,
			rejectedCount: 0,
			joinedCount: 0,
		},
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

/**
 * URLに基づいてモックレスポンスを返すヘルパー
 */
function createMockFetch(
	soloResponse: { ok: boolean; data: unknown },
	groupResponse: { ok: boolean; data: unknown },
) {
	return (url: string) => {
		if (url.includes('/api/solo-matchings/guest')) {
			return Promise.resolve({
				ok: soloResponse.ok,
				json: async () => soloResponse.data,
			})
		}
		if (url.includes('/api/group-matchings/guest')) {
			return Promise.resolve({
				ok: groupResponse.ok,
				json: async () => groupResponse.data,
			})
		}
		return Promise.reject(new Error('Unknown URL'))
	}
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
			let resolveSoloFetch: (value: unknown) => void
			let resolveGroupFetch: (value: unknown) => void
			const soloFetchPromise = new Promise((resolve) => {
				resolveSoloFetch = resolve
			})
			const groupFetchPromise = new Promise((resolve) => {
				resolveGroupFetch = resolve
			})

			// fetchを遅延させる
			mockFetch.mockImplementation((url: string) => {
				if (url.includes('/api/solo-matchings/guest')) {
					return soloFetchPromise
				}
				if (url.includes('/api/group-matchings/guest')) {
					return groupFetchPromise
				}
				return Promise.reject(new Error('Unknown URL'))
			})

			render(<MatchingStatusList />, { wrapper: TestWrapper })

			// ローディングメッセージが表示されることを確認
			await expect
				.element(page.getByText('マッチング状況を読み込み中...'))
				.toBeInTheDocument()

			// fetchを解決
			resolveSoloFetch!({
				ok: true,
				json: async () => ({ success: true, soloMatchings: [] }),
			})
			resolveGroupFetch!({
				ok: true,
				json: async () => ({ success: true, groupMatchings: [] }),
			})

			// データ取得完了後、「マッチングはありません」が表示されることを確認
			await expect
				.element(page.getByText('マッチングはありません'))
				.toBeInTheDocument()
		})
	})

	describe('正常系', () => {
		it('ソロマッチングとグループマッチングの両方を表示する', async () => {
			mockFetch.mockImplementation(
				createMockFetch(
					{
						ok: true,
						data: { success: true, soloMatchings: mockSoloMatchings },
					},
					{
						ok: true,
						data: { success: true, groupMatchings: mockGroupMatchings },
					},
				),
			)

			render(<MatchingStatusList />, { wrapper: TestWrapper })

			// コンパクト表示でステータスバッジが表示されることを確認
			// ソロとグループの両方にpendingがあるため、複数の「回答待ち」が存在する
			await expect
				.element(page.getByText('回答待ち').first())
				.toBeInTheDocument()
			await expect.element(page.getByText('成立')).toBeInTheDocument()

			// カードをクリックしてモーダルで詳細を確認
			const cards = page.getByRole('button')
			await cards.first().click()

			// モーダルが開いていることを確認（ダイアログが表示される）
			await expect.element(page.getByRole('dialog')).toBeInTheDocument()
		})

		it('ソロマッチングのみ存在する場合は表示する', async () => {
			mockFetch.mockImplementation(
				createMockFetch(
					{
						ok: true,
						data: { success: true, soloMatchings: mockSoloMatchings },
					},
					{ ok: true, data: { success: true, groupMatchings: [] } },
				),
			)

			render(<MatchingStatusList />, { wrapper: TestWrapper })

			// コンパクト表示でステータスバッジが表示されることを確認
			await expect.element(page.getByText('回答待ち')).toBeInTheDocument()
			await expect.element(page.getByText('成立')).toBeInTheDocument()

			// 「マッチングはありません」は表示されない
			await expect
				.element(page.getByText('マッチングはありません'))
				.not.toBeInTheDocument()
		})

		it('グループマッチングのみ存在する場合は表示する', async () => {
			mockFetch.mockImplementation(
				createMockFetch(
					{ ok: true, data: { success: true, soloMatchings: [] } },
					{
						ok: true,
						data: { success: true, groupMatchings: mockGroupMatchings },
					},
				),
			)

			render(<MatchingStatusList />, { wrapper: TestWrapper })

			// コンパクト表示でステータスバッジが表示されることを確認
			await expect.element(page.getByText('回答待ち')).toBeInTheDocument()

			// 「マッチングはありません」は表示されない
			await expect
				.element(page.getByText('マッチングはありません'))
				.not.toBeInTheDocument()
		})

		it('マッチングが0件の場合はメッセージを表示する', async () => {
			mockFetch.mockImplementation(
				createMockFetch(
					{ ok: true, data: { success: true, soloMatchings: [] } },
					{ ok: true, data: { success: true, groupMatchings: [] } },
				),
			)

			render(<MatchingStatusList />, { wrapper: TestWrapper })

			// 「マッチングはありません」メッセージが表示されることを確認
			await expect
				.element(page.getByText('マッチングはありません'))
				.toBeInTheDocument()
		})
	})

	describe('エラーハンドリング', () => {
		it('ソロマッチングAPIエラーの場合はエラーメッセージを表示する', async () => {
			mockFetch.mockImplementation(
				createMockFetch(
					{
						ok: false,
						data: { success: false, error: 'ソロマッチング取得エラー' },
					},
					{ ok: true, data: { success: true, groupMatchings: [] } },
				),
			)

			render(<MatchingStatusList />, { wrapper: TestWrapper })

			// エラーメッセージが表示されることを確認
			await expect
				.element(page.getByText('ソロマッチング取得エラー'))
				.toBeInTheDocument()
		})

		it('グループマッチングAPIエラーの場合はエラーメッセージを表示する', async () => {
			mockFetch.mockImplementation(
				createMockFetch(
					{ ok: true, data: { success: true, soloMatchings: [] } },
					{
						ok: false,
						data: { success: false, error: 'グループマッチング取得エラー' },
					},
				),
			)

			render(<MatchingStatusList />, { wrapper: TestWrapper })

			// エラーメッセージが表示されることを確認
			await expect
				.element(page.getByText('グループマッチング取得エラー'))
				.toBeInTheDocument()
		})

		it('ネットワークエラーの場合はエラーメッセージを表示する', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'))

			render(<MatchingStatusList />, { wrapper: TestWrapper })

			// エラーメッセージが表示されることを確認
			await expect.element(page.getByText('Network error')).toBeInTheDocument()
		})
	})
})
