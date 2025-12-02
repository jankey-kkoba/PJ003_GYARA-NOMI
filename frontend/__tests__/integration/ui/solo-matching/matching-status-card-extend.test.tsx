/**
 * MatchingStatusCard 延長機能 Integration テスト
 *
 * マッチング延長UIのテスト
 * 延長ボタンの表示条件、延長時間選択、延長実行を検証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { SoloMatching } from '@/features/solo-matching/types/soloMatching'

// Hono クライアントのモック
const mockExtendPatch = vi.fn()
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
						extend: { $patch: mockExtendPatch },
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
 * 進行中のマッチングデータ（終了予定時刻が過去）
 */
function createInProgressMatching(
	overrides: Partial<SoloMatching> = {},
): SoloMatching {
	return {
		id: 'matching-in-progress',
		guestId: 'guest-1',
		castId: 'cast-1',
		chatRoomId: null,
		status: 'in_progress',
		proposedDate: new Date('2025-11-28T17:00:00Z'),
		proposedDuration: 120,
		proposedLocation: '渋谷駅周辺',
		totalPoints: 10000,
		startedAt: new Date('2025-11-28T17:00:00Z'),
		// 終了予定時刻を過去に設定
		scheduledEndAt: new Date('2020-01-01T19:00:00Z'),
		actualEndAt: null,
		extensionMinutes: 0,
		extensionPoints: 0,
		castRespondedAt: new Date('2025-11-28T16:30:00Z'),
		createdAt: new Date('2025-11-28T10:00:00Z'),
		updatedAt: new Date('2025-11-28T17:00:00Z'),
		...overrides,
	}
}

describe('MatchingStatusCard 延長機能', () => {
	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})
		vi.clearAllMocks()
	})

	describe('延長ボタンの表示条件', () => {
		it('ゲストビューかつin_progress状態かつ終了予定時刻が過ぎている場合に延長ボタンを表示する', async () => {
			const matching = createInProgressMatching()

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			// 延長ボタンが表示されることを確認
			await expect.element(page.getByText('延長する')).toBeInTheDocument()
		})

		it('ゲストビューでない場合は延長ボタンを表示しない', async () => {
			const matching = createInProgressMatching()

			render(<MatchingStatusCard matching={matching} isGuestView={false} />, {
				wrapper: TestWrapper,
			})

			// 延長ボタンが表示されないことを確認
			await expect.element(page.getByText('延長する')).not.toBeInTheDocument()
		})

		it('in_progress状態でない場合は延長ボタンを表示しない', async () => {
			const matching = createInProgressMatching({ status: 'pending' })

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			// 延長ボタンが表示されないことを確認
			await expect.element(page.getByText('延長する')).not.toBeInTheDocument()
		})

		it('終了予定時刻が未来の場合は延長ボタンを表示しない', async () => {
			const matching = createInProgressMatching({
				// 終了予定時刻を未来に設定
				scheduledEndAt: new Date(Date.now() + 3600000),
			})

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			// 延長ボタンが表示されないことを確認
			await expect.element(page.getByText('延長する')).not.toBeInTheDocument()
		})
	})

	describe('延長時間の選択', () => {
		it('延長時間のセレクトが表示される', async () => {
			const matching = createInProgressMatching()

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			// セレクトトリガーが表示されることを確認
			await expect.element(page.getByText('30分')).toBeInTheDocument()
		})

		it('延長ポイントが表示される', async () => {
			const matching = createInProgressMatching()

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			// 延長ポイント（30分 × 5000円/時 = 2500ポイント）が表示されることを確認
			await expect
				.element(page.getByText('延長ポイント: 2,500ポイント'))
				.toBeInTheDocument()
		})
	})

	describe('延長の実行', () => {
		it('延長ボタンをクリックするとAPIが呼ばれる', async () => {
			const matching = createInProgressMatching()

			mockExtendPatch.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					soloMatching: {
						...matching,
						proposedDate: matching.proposedDate.toISOString(),
						startedAt: matching.startedAt?.toISOString(),
						scheduledEndAt: matching.scheduledEndAt?.toISOString(),
						castRespondedAt: matching.castRespondedAt?.toISOString(),
						createdAt: matching.createdAt.toISOString(),
						updatedAt: matching.updatedAt.toISOString(),
						extensionMinutes: 30,
						extensionPoints: 2500,
						totalPoints: 12500,
					},
				}),
			})

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			// 延長ボタンをクリック
			await page.getByText('延長する').click()

			// APIが呼ばれることを確認
			await vi.waitFor(() => {
				expect(mockExtendPatch).toHaveBeenCalledWith({
					param: { id: 'matching-in-progress' },
					json: { extensionMinutes: 30 },
				})
			})
		})

		it('APIエラー時にエラーメッセージを表示する', async () => {
			const matching = createInProgressMatching()

			mockExtendPatch.mockResolvedValue({
				ok: false,
				json: async () => ({
					error: 'マッチングが見つかりません',
				}),
			})

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			// 延長ボタンをクリック
			await page.getByText('延長する').click()

			// エラーメッセージが表示されることを確認
			await expect
				.element(page.getByText('マッチングが見つかりません'))
				.toBeInTheDocument()
		})
	})

	describe('ステータス表示', () => {
		it('in_progressステータスは「ギャラ飲み中」と表示される', async () => {
			const matching = createInProgressMatching()

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			// ステータスバッジが表示されることを確認
			await expect.element(page.getByText('ギャラ飲み中')).toBeInTheDocument()
		})
	})
})
