/**
 * MatchingStatusCard ステータス表示 Integration テスト
 *
 * ソロマッチングステータスカードの表示テスト
 *
 * 注意: ISSUE #95により、ゲスト側では in_progress 状態のマッチングは
 * サービス層でフィルタリングされて表示されないため、
 * ゲスト側での延長機能テストは削除されました。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'

// Hono クライアントのモック
vi.mock('@/libs/hono/client', () => ({
	usersClient: { api: { users: {} } },
	castsClient: { api: { casts: {} } },
	favoritesClient: { api: { favorites: {} } },
	photosClient: { api: { casts: { photos: {} } } },
	castReviewsClient: { api: { 'cast-reviews': {} } },
	castSoloMatchingsClient: {
		api: {
			'solo-matchings': {
				cast: {
					$get: vi.fn(),
					':id': {
						start: { $patch: vi.fn() },
						end: { $patch: vi.fn() },
						$patch: vi.fn(),
					},
				},
			},
		},
	},
	guestSoloMatchingsClient: {
		api: {
			'solo-matchings': {
				guest: {
					$get: vi.fn(),
					$post: vi.fn(),
					completed: { $get: vi.fn() },
					pending: { ':castId': { $get: vi.fn() } },
					':id': {
						extend: { $patch: vi.fn() },
					},
				},
			},
		},
	},
}))

// モック後にインポート
const { MatchingStatusCard } =
	await import('@/features/solo-matching/components/molecules/MatchingStatusCard')

let queryClient: QueryClient

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}

/**
 * マッチングデータを作成
 */
function createMatching(overrides: Partial<SoloMatching> = {}): SoloMatching {
	return {
		id: 'matching-1',
		guestId: 'guest-1',
		castId: 'cast-1',
		chatRoomId: null,
		status: 'pending',
		proposedDate: '2025-11-28T17:00:00.000Z',
		proposedDuration: 120,
		proposedLocation: '渋谷駅周辺',
		totalPoints: 10000,
		startedAt: null,
		scheduledEndAt: null,
		actualEndAt: null,
		extensionMinutes: 0,
		extensionPoints: 0,
		castRespondedAt: null,
		createdAt: '2025-11-28T10:00:00.000Z',
		updatedAt: '2025-11-28T17:00:00.000Z',
		...overrides,
	}
}

describe('MatchingStatusCard ステータス表示', () => {
	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})
		vi.clearAllMocks()
	})

	describe('延長ボタンの非表示条件', () => {
		it('ゲストビューでない場合は延長ボタンを表示しない', async () => {
			const matching = createMatching({
				status: 'in_progress',
				startedAt: '2025-11-28T17:00:00.000Z',
				scheduledEndAt: '2020-01-01T19:00:00.000Z',
			})

			render(<MatchingStatusCard matching={matching} isGuestView={false} />, {
				wrapper: TestWrapper,
			})

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// 延長ボタンが表示されないことを確認
			await expect.element(page.getByText('延長する')).not.toBeInTheDocument()
		})

		it('pending状態では延長ボタンを表示しない', async () => {
			const matching = createMatching({ status: 'pending' })

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// 延長ボタンが表示されないことを確認
			await expect.element(page.getByText('延長する')).not.toBeInTheDocument()
		})

		it('accepted状態では延長ボタンを表示しない', async () => {
			const matching = createMatching({
				status: 'accepted',
				castRespondedAt: '2025-11-28T16:30:00.000Z',
			})

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// 延長ボタンが表示されないことを確認
			await expect.element(page.getByText('延長する')).not.toBeInTheDocument()
		})
	})

	describe('ステータスバッジ表示', () => {
		it('pendingステータスは「回答待ち」と表示される', async () => {
			const matching = createMatching({ status: 'pending' })

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('回答待ち')).toBeInTheDocument()
		})

		it('acceptedステータスは「成立」と表示される', async () => {
			const matching = createMatching({
				status: 'accepted',
				castRespondedAt: '2025-11-28T16:30:00.000Z',
			})

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('成立')).toBeInTheDocument()
		})

		it('rejectedステータスは「不成立」と表示される', async () => {
			const matching = createMatching({
				status: 'rejected',
				castRespondedAt: '2025-11-28T16:30:00.000Z',
			})

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('不成立')).toBeInTheDocument()
		})

		it('cancelledステータスは「キャンセル」と表示される', async () => {
			const matching = createMatching({ status: 'cancelled' })

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('キャンセル')).toBeInTheDocument()
		})

		it('completedステータスは「完了」と表示される', async () => {
			const matching = createMatching({
				status: 'completed',
				startedAt: '2025-11-28T17:00:00.000Z',
				actualEndAt: '2025-11-28T19:00:00.000Z',
			})

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('完了')).toBeInTheDocument()
		})
	})
})
