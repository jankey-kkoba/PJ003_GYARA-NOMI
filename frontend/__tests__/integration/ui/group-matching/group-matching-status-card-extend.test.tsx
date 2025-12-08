/**
 * GroupMatchingStatusCard 延長機能 Integration テスト
 *
 * グループマッチング延長UIのテスト
 * 延長ボタンの表示条件、延長時間選択、延長実行を検証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { GuestGroupMatching } from '@/features/group-matching/types/groupMatching'

// Hono クライアントのモック
const mockExtendPatch = vi.fn()
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
						extend: { $patch: mockExtendPatch },
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
 * 進行中のグループマッチングデータ（終了予定時刻が過去）
 */
function createInProgressGroupMatching(
	overrides: Partial<GuestGroupMatching> = {},
): GuestGroupMatching {
	return {
		id: 'group-matching-in-progress',
		guestId: 'guest-1',
		chatRoomId: 'chat-1',
		status: 'in_progress',
		proposedDate: '2025-11-28T17:00:00.000Z',
		proposedDuration: 120,
		proposedLocation: '渋谷駅周辺',
		totalPoints: 18000,
		startedAt: '2025-11-28T17:00:00.000Z',
		// 終了予定時刻を過去に設定
		scheduledEndAt: '2020-01-01T19:00:00.000Z',
		actualEndAt: null,
		extensionMinutes: 0,
		extensionPoints: 0,
		recruitingEndedAt: '2025-11-28T16:30:00.000Z',
		requestedCastCount: 3,
		createdAt: '2025-11-28T10:00:00.000Z',
		updatedAt: '2025-11-28T17:00:00.000Z',
		type: 'group',
		participantSummary: {
			pendingCount: 0,
			acceptedCount: 3,
			rejectedCount: 0,
			joinedCount: 3,
		},
		...overrides,
	}
}

describe('GroupMatchingStatusCard 延長機能', () => {
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
		it('in_progress状態かつ終了予定時刻が過ぎている場合に延長ボタンを表示する', async () => {
			const matching = createInProgressGroupMatching()

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			// 延長ボタンが表示されることを確認
			await expect.element(page.getByText('延長する')).toBeInTheDocument()
		})

		it('in_progress状態でない場合は延長ボタンを表示しない', async () => {
			const matching = createInProgressGroupMatching({ status: 'pending' })

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			// 延長ボタンが表示されないことを確認
			await expect.element(page.getByText('延長する')).not.toBeInTheDocument()
		})

		it('accepted状態では延長ボタンを表示しない', async () => {
			const matching = createInProgressGroupMatching({ status: 'accepted' })

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			// 延長ボタンが表示されないことを確認
			await expect.element(page.getByText('延長する')).not.toBeInTheDocument()
		})

		it('completed状態では延長ボタンを表示しない', async () => {
			const matching = createInProgressGroupMatching({ status: 'completed' })

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			// 延長ボタンが表示されないことを確認
			await expect.element(page.getByText('延長する')).not.toBeInTheDocument()
		})

		it('終了予定時刻が未来の場合は延長ボタンを表示しない', async () => {
			const matching = createInProgressGroupMatching({
				// 終了予定時刻を未来に設定
				scheduledEndAt: new Date(Date.now() + 3600000).toISOString(),
			})

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			// 延長ボタンが表示されないことを確認
			await expect.element(page.getByText('延長する')).not.toBeInTheDocument()
		})
	})

	describe('延長時間の選択', () => {
		it('延長時間のセレクトが表示される', async () => {
			const matching = createInProgressGroupMatching()

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			// セレクトトリガーのデフォルト値（30分）が表示されることを確認
			await expect.element(page.getByText('30分')).toBeInTheDocument()
		})

		it('延長ポイントが表示される', async () => {
			const matching = createInProgressGroupMatching()

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			// 延長ポイントが表示されることを確認
			// 計算: (30分 / 60) × (18000 × 60 / 120 / 3) × 3 = 4500ポイント
			await expect
				.element(page.getByText('延長ポイント: 4,500ポイント'))
				.toBeInTheDocument()
		})
	})

	describe('延長の実行', () => {
		it('延長ボタンをクリックするとAPIが呼ばれる', async () => {
			const matching = createInProgressGroupMatching()

			mockExtendPatch.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					groupMatching: {
						...matching,
						extensionMinutes: 30,
						extensionPoints: 4500,
						totalPoints: 22500,
					},
				}),
			})

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			// 延長ボタンをクリック（確認ダイアログを開く）
			await page.getByRole('button', { name: '延長する' }).click()

			// 確認ダイアログが表示されることを確認
			await expect
				.element(page.getByText('グループギャラ飲みを延長しますか？'))
				.toBeInTheDocument()

			// ダイアログ内の確認ボタンをクリック（実際にAPIを呼ぶ）
			await page
				.getByRole('alertdialog')
				.getByRole('button', { name: '延長する' })
				.click()

			// APIが呼ばれることを確認
			await vi.waitFor(() => {
				expect(mockExtendPatch).toHaveBeenCalledWith({
					param: { id: 'group-matching-in-progress' },
					json: { extensionMinutes: 30 },
				})
			})
		})

		it('APIエラー時にエラーメッセージを表示する', async () => {
			const matching = createInProgressGroupMatching()

			mockExtendPatch.mockResolvedValue({
				ok: false,
				status: 404,
				json: async () => ({
					error: 'マッチングが見つかりません',
				}),
			})

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			// 延長ボタンをクリック（確認ダイアログを開く）
			await page.getByRole('button', { name: '延長する' }).click()

			// 確認ダイアログが表示されることを確認
			await expect
				.element(page.getByText('グループギャラ飲みを延長しますか？'))
				.toBeInTheDocument()

			// ダイアログ内の確認ボタンをクリック（実際にAPIを呼ぶ）
			await page
				.getByRole('alertdialog')
				.getByRole('button', { name: '延長する' })
				.click()

			// APIから返されたエラーメッセージが表示されることを確認
			await expect
				.element(page.getByText('マッチングが見つかりません'))
				.toBeInTheDocument()
		})
	})

	describe('ステータス表示', () => {
		it('in_progressステータスは「ギャラ飲み中」と表示される', async () => {
			const matching = createInProgressGroupMatching()

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			// ステータスバッジが表示されることを確認
			await expect.element(page.getByText('ギャラ飲み中')).toBeInTheDocument()
		})

		it('pendingステータスは「回答待ち」と表示される', async () => {
			const matching = createInProgressGroupMatching({ status: 'pending' })

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('回答待ち')).toBeInTheDocument()
		})

		it('acceptedステータスは「成立」と表示される', async () => {
			const matching = createInProgressGroupMatching({ status: 'accepted' })

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('成立')).toBeInTheDocument()
		})

		it('completedステータスは「完了」と表示される', async () => {
			const matching = createInProgressGroupMatching({ status: 'completed' })

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('完了')).toBeInTheDocument()
		})
	})

	describe('参加者サマリー表示', () => {
		it('合流済みキャスト数が表示される', async () => {
			const matching = createInProgressGroupMatching()

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('合流済み: 3人')).toBeInTheDocument()
		})

		it('承認済みキャスト数が表示される', async () => {
			const matching = createInProgressGroupMatching({
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

			await expect.element(page.getByText('承認: 2人')).toBeInTheDocument()
		})

		it('回答待ちキャスト数が表示される', async () => {
			const matching = createInProgressGroupMatching({
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

			await expect.element(page.getByText('回答待ち: 5人')).toBeInTheDocument()
		})
	})

	describe('マッチング情報表示', () => {
		it('希望人数が表示される', async () => {
			const matching = createInProgressGroupMatching()

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('3人募集')).toBeInTheDocument()
		})

		it('場所が表示される', async () => {
			const matching = createInProgressGroupMatching()

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('渋谷駅周辺')).toBeInTheDocument()
		})

		it('合計ポイントが表示される', async () => {
			const matching = createInProgressGroupMatching()

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('18,000ポイント')).toBeInTheDocument()
		})

		it('時間が表示される', async () => {
			const matching = createInProgressGroupMatching()

			render(<GroupMatchingStatusCard matching={matching} />, {
				wrapper: TestWrapper,
			})

			await expect.element(page.getByText('120分')).toBeInTheDocument()
		})
	})
})
