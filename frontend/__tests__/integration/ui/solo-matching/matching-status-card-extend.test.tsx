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
		proposedDate: '2025-11-28T17:00:00.000Z',
		proposedDuration: 120,
		proposedLocation: '渋谷駅周辺',
		totalPoints: 10000,
		startedAt: '2025-11-28T17:00:00.000Z',
		// 終了予定時刻を過去に設定
		scheduledEndAt: '2020-01-01T19:00:00.000Z',
		actualEndAt: null,
		extensionMinutes: 0,
		extensionPoints: 0,
		castRespondedAt: '2025-11-28T16:30:00.000Z',
		createdAt: '2025-11-28T10:00:00.000Z',
		updatedAt: '2025-11-28T17:00:00.000Z',
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

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// 延長ボタンが表示されることを確認
			await expect.element(page.getByText('延長する')).toBeInTheDocument()
		})

		it('ゲストビューでない場合は延長ボタンを表示しない', async () => {
			const matching = createInProgressMatching()

			render(<MatchingStatusCard matching={matching} isGuestView={false} />, {
				wrapper: TestWrapper,
			})

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// 延長ボタンが表示されないことを確認
			await expect.element(page.getByText('延長する')).not.toBeInTheDocument()
		})

		it('in_progress状態でない場合は延長ボタンを表示しない', async () => {
			const matching = createInProgressMatching({ status: 'pending' })

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// 延長ボタンが表示されないことを確認
			await expect.element(page.getByText('延長する')).not.toBeInTheDocument()
		})

		it('終了予定時刻が未来の場合は延長ボタンを表示しない', async () => {
			const matching = createInProgressMatching({
				// 終了予定時刻を未来に設定
				scheduledEndAt: new Date(Date.now() + 3600000).toISOString(),
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

	describe('延長時間の選択', () => {
		it('延長時間のセレクトが表示される', async () => {
			const matching = createInProgressMatching()

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// セレクトトリガーが表示されることを確認
			await expect.element(page.getByText('30分')).toBeInTheDocument()
		})

		it('延長ポイントが表示される', async () => {
			const matching = createInProgressMatching()

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

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
						extensionMinutes: 30,
						extensionPoints: 2500,
						totalPoints: 12500,
					},
				}),
			})

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// 延長ボタンをクリック（確認ダイアログを開く）
			await page.getByRole('button', { name: '延長する' }).click()

			// 確認ダイアログが表示されることを確認
			await expect
				.element(page.getByText('ギャラ飲みを延長しますか？'))
				.toBeInTheDocument()

			// ダイアログ内の確認ボタンをクリック（実際にAPIを呼ぶ）
			await page
				.getByRole('alertdialog')
				.getByRole('button', { name: '延長する' })
				.click()

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
				status: 404,
				json: async () => ({
					error: 'マッチングが見つかりません',
				}),
			})

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// 延長ボタンをクリック（確認ダイアログを開く）
			await page.getByRole('button', { name: '延長する' }).click()

			// 確認ダイアログが表示されることを確認
			await expect
				.element(page.getByText('ギャラ飲みを延長しますか？'))
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
			const matching = createInProgressMatching()

			render(<MatchingStatusCard matching={matching} isGuestView={true} />, {
				wrapper: TestWrapper,
			})

			// ステータスバッジが表示されることを確認
			await expect.element(page.getByText('ギャラ飲み中')).toBeInTheDocument()
		})
	})
})
