/**
 * GroupMatchingStatusCard ステータス表示 Integration テスト
 *
 * グループマッチングステータスカードの表示テスト
 *
 * 注意: ISSUE #95により、ゲスト側では in_progress 状態のマッチングは
 * サービス層でフィルタリングされて表示されないため、
 * ゲスト側での延長機能テストは削除されました。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { GuestGroupMatching } from '@/features/group-matching/types/groupMatching'

// Hono クライアントのモック
vi.mock('@/libs/hono/client', () => ({
	usersClient: { api: { users: {} } },
	castsClient: { api: { casts: {} } },
	favoritesClient: { api: { favorites: {} } },
	photosClient: { api: { casts: { photos: {} } } },
	castReviewsClient: { api: { 'cast-reviews': {} } },
	guestGroupMatchingsClient: {
		api: {
			'group-matchings': {
				guest: {
					$get: vi.fn(),
					$post: vi.fn(),
					':id': {
						extend: { $patch: vi.fn() },
					},
				},
			},
		},
	},
	castGroupMatchingsClient: {
		api: {
			'group-matchings': {
				cast: {
					$get: vi.fn(),
					':id': {
						$patch: vi.fn(),
						start: { $patch: vi.fn() },
						end: { $patch: vi.fn() },
						join: { $patch: vi.fn() },
					},
				},
			},
		},
	},
}))

// モック後にインポート
const { GroupMatchingStatusCard } =
	await import('@/features/group-matching/components/molecules/GroupMatchingStatusCard')

let queryClient: QueryClient

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}

/**
 * グループマッチングデータを作成
 */
function createGroupMatching(
	overrides: Partial<GuestGroupMatching> = {},
): GuestGroupMatching {
	return {
		id: 'group-matching-1',
		guestId: 'guest-1',
		chatRoomId: 'chat-1',
		status: 'pending',
		proposedDate: '2025-11-28T17:00:00.000Z',
		proposedDuration: 120,
		proposedLocation: '渋谷駅周辺',
		totalPoints: 18000,
		startedAt: null,
		scheduledEndAt: null,
		actualEndAt: null,
		extensionMinutes: 0,
		extensionPoints: 0,
		recruitingEndedAt: '2025-11-28T16:30:00.000Z',
		requestedCastCount: 3,
		createdAt: '2025-11-28T10:00:00.000Z',
		updatedAt: '2025-11-28T17:00:00.000Z',
		type: 'group',
		participantSummary: {
			pendingCount: 5,
			acceptedCount: 0,
			rejectedCount: 0,
			joinedCount: 0,
		},
		...overrides,
	}
}

describe('GroupMatchingStatusCard ステータス表示', () => {
	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})
		vi.clearAllMocks()
	})

	describe('ステータスバッジ表示', () => {
		it('pendingステータスは「回答待ち」と表示される', async () => {
			const matching = createGroupMatching({ status: 'pending' })

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('回答待ち')).toBeInTheDocument()
		})

		it('acceptedステータスは「成立」と表示される', async () => {
			const matching = createGroupMatching({ status: 'accepted' })

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('成立')).toBeInTheDocument()
		})

		it('completedステータスは「完了」と表示される', async () => {
			const matching = createGroupMatching({ status: 'completed' })

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('完了')).toBeInTheDocument()
		})

		it('rejectedステータスは「不成立」と表示される', async () => {
			const matching = createGroupMatching({ status: 'rejected' })

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('不成立')).toBeInTheDocument()
		})

		it('cancelledステータスは「キャンセル」と表示される', async () => {
			const matching = createGroupMatching({ status: 'cancelled' })

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('キャンセル')).toBeInTheDocument()
		})
	})

	describe('参加者サマリー表示（モーダル内）', () => {
		it('回答待ちキャスト数が表示される', async () => {
			const matching = createGroupMatching({
				status: 'pending',
				participantSummary: {
					pendingCount: 5,
					acceptedCount: 0,
					rejectedCount: 0,
					joinedCount: 0,
				},
			})

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			// カードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			await expect.element(page.getByText('回答待ち: 5人')).toBeInTheDocument()
		})

		it('承認済みキャスト数が表示される', async () => {
			const matching = createGroupMatching({
				status: 'accepted',
				participantSummary: {
					pendingCount: 0,
					acceptedCount: 2,
					rejectedCount: 1,
					joinedCount: 0,
				},
			})

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			// カードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			await expect.element(page.getByText('承認: 2人')).toBeInTheDocument()
		})
	})

	describe('マッチング情報表示', () => {
		it('希望人数が表示される（モーダル内）', async () => {
			const matching = createGroupMatching()

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			// カードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			await expect.element(page.getByText('3人募集')).toBeInTheDocument()
		})

		it('場所が表示される', async () => {
			const matching = createGroupMatching()

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('渋谷駅周辺')).toBeInTheDocument()
		})

		it('合計ポイントが表示される（モーダル内）', async () => {
			const matching = createGroupMatching()

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			// カードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			await expect.element(page.getByText('18,000ポイント')).toBeInTheDocument()
		})

		it('時間が表示される（モーダル内）', async () => {
			const matching = createGroupMatching()

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			// カードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			await expect.element(page.getByText('120分')).toBeInTheDocument()
		})
	})
})
