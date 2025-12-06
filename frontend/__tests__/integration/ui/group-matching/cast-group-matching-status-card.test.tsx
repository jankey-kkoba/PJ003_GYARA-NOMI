/**
 * CastGroupMatchingStatusCard コンポーネント統合テスト
 *
 * キャスト向けグループマッチング状況カードの動作を検証
 * ボタン表示条件、回答操作、状態変化をテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CastGroupMatchingStatusCard } from '@/features/group-matching/components/molecules/CastGroupMatchingStatusCard'
import type { CastGroupMatching } from '@/features/group-matching/types/groupMatching'

// Fetch APIのモック
const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

let queryClient: QueryClient

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}

/**
 * テスト用のマッチングデータを作成
 */
function createMockMatching(
	overrides: Partial<CastGroupMatching> = {},
): CastGroupMatching {
	return {
		id: 'matching-123',
		guestId: 'guest-001',
		chatRoomId: null,
		status: 'pending',
		proposedDate: new Date('2025-01-15T18:00:00'),
		proposedDuration: 120,
		proposedLocation: '渋谷駅周辺',
		totalPoints: 18000,
		startedAt: null,
		scheduledEndAt: null,
		actualEndAt: null,
		extensionMinutes: 0,
		extensionPoints: 0,
		recruitingEndedAt: null,
		requestedCastCount: 3,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		type: 'group',
		participantStatus: 'pending',
		guest: {
			id: 'guest-001',
			nickname: 'テストゲスト',
		},
		participantSummary: {
			requestedCount: 3,
			acceptedCount: 0,
			joinedCount: 0,
		},
		...overrides,
	}
}

describe('CastGroupMatchingStatusCard', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})
	})

	describe('初期表示', () => {
		it('カード情報が正しく表示される', async () => {
			const matching = createMockMatching()

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// ゲスト名
			await expect
				.element(page.getByText('テストゲストさん'))
				.toBeInTheDocument()

			// オファータイトル
			await expect
				.element(page.getByText('グループオファー'))
				.toBeInTheDocument()

			// 時間
			await expect.element(page.getByText('120分')).toBeInTheDocument()

			// 場所
			await expect.element(page.getByText('渋谷駅周辺')).toBeInTheDocument()

			// 募集人数
			await expect.element(page.getByText('募集: 3人')).toBeInTheDocument()
		})

		it('pending状態で回答待ちバッジが表示される', async () => {
			const matching = createMockMatching({ participantStatus: 'pending' })

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			await expect.element(page.getByText('回答待ち')).toBeInTheDocument()
		})

		it('accepted状態で参加予定バッジが表示される', async () => {
			const matching = createMockMatching({ participantStatus: 'accepted' })

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			await expect.element(page.getByText('参加予定')).toBeInTheDocument()
		})

		it('rejected状態で辞退バッジが表示される', async () => {
			const matching = createMockMatching({ participantStatus: 'rejected' })

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			await expect.element(page.getByText('辞退')).toBeInTheDocument()
		})
	})

	describe('回答ボタン表示条件', () => {
		it('participantStatus=pending かつ status=pending で回答ボタンが表示される', async () => {
			const matching = createMockMatching({
				participantStatus: 'pending',
				status: 'pending',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			await expect
				.element(page.getByRole('button', { name: '参加する' }))
				.toBeInTheDocument()
			await expect
				.element(page.getByRole('button', { name: '辞退する' }))
				.toBeInTheDocument()
		})

		it('participantStatus=accepted で回答ボタンが表示されない', async () => {
			const matching = createMockMatching({
				participantStatus: 'accepted',
				status: 'pending',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// ボタンが存在しないことを確認
			const acceptButton = page.getByRole('button', { name: '参加する' })
			await expect.element(acceptButton).not.toBeInTheDocument()
		})

		it('participantStatus=rejected で回答ボタンが表示されない', async () => {
			const matching = createMockMatching({
				participantStatus: 'rejected',
				status: 'pending',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// ボタンが存在しないことを確認
			const rejectButton = page.getByRole('button', { name: '辞退する' })
			await expect.element(rejectButton).not.toBeInTheDocument()
		})

		it('status=accepted で回答ボタンが表示されない', async () => {
			const matching = createMockMatching({
				participantStatus: 'pending',
				status: 'accepted', // マッチングが成立済み
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// ボタンが存在しないことを確認
			const acceptButton = page.getByRole('button', { name: '参加する' })
			await expect.element(acceptButton).not.toBeInTheDocument()
		})
	})

	describe('回答操作', () => {
		it('参加するボタンをクリックするとAPIが呼ばれる', async () => {
			mockFetch.mockImplementation(() => {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						groupMatching: createMockMatching({
							participantStatus: 'accepted',
						}),
					}),
				} as Response)
			})

			const matching = createMockMatching({
				participantStatus: 'pending',
				status: 'pending',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 参加するボタンをクリック
			const acceptButton = page.getByRole('button', { name: '参加する' })
			await acceptButton.click()

			// API呼び出しを待つ
			await vi.waitFor(
				() => {
					expect(mockFetch).toHaveBeenCalled()
					// リクエストボディを検証
					const [url, options] = mockFetch.mock.calls[0]
					expect(url).toContain('/api/group-matchings/cast/matching-123')
					const body = JSON.parse(options.body)
					expect(body.response).toBe('accepted')
				},
				{ timeout: 3000 },
			)
		})

		it('辞退するボタンをクリックするとAPIが呼ばれる', async () => {
			mockFetch.mockImplementation(() => {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						groupMatching: createMockMatching({
							participantStatus: 'rejected',
						}),
					}),
				} as Response)
			})

			const matching = createMockMatching({
				participantStatus: 'pending',
				status: 'pending',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 辞退するボタンをクリック
			const rejectButton = page.getByRole('button', { name: '辞退する' })
			await rejectButton.click()

			// API呼び出しを待つ
			await vi.waitFor(
				() => {
					expect(mockFetch).toHaveBeenCalled()
					// リクエストボディを検証
					const [url, options] = mockFetch.mock.calls[0]
					expect(url).toContain('/api/group-matchings/cast/matching-123')
					const body = JSON.parse(options.body)
					expect(body.response).toBe('rejected')
				},
				{ timeout: 3000 },
			)
		})

		it('API処理中はボタンがdisabledになる', async () => {
			let resolvePromise: (value: Response) => void = () => {}
			const pendingPromise = new Promise<Response>((resolve) => {
				resolvePromise = resolve
			})

			mockFetch.mockReturnValue(pendingPromise)

			const matching = createMockMatching({
				participantStatus: 'pending',
				status: 'pending',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 参加するボタンをクリック
			const acceptButton = page.getByRole('button', { name: '参加する' })
			await acceptButton.click()

			// ボタンがdisabledになる
			await vi.waitFor(async () => {
				await expect
					.element(page.getByRole('button', { name: '参加する' }))
					.toBeDisabled()
				await expect
					.element(page.getByRole('button', { name: '辞退する' }))
					.toBeDisabled()
			})

			// 後処理: Promiseを解決
			resolvePromise({
				ok: true,
				json: async () => ({
					success: true,
					groupMatching: createMockMatching({ participantStatus: 'accepted' }),
				}),
			} as Response)
		})

		it('APIエラー時にエラーメッセージが表示される', async () => {
			mockFetch.mockImplementation(() => {
				return Promise.resolve({
					ok: false,
					json: async () => ({
						success: false,
						error: '回答に失敗しました',
					}),
				} as Response)
			})

			const matching = createMockMatching({
				participantStatus: 'pending',
				status: 'pending',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 参加するボタンをクリック
			const acceptButton = page.getByRole('button', { name: '参加する' })
			await acceptButton.click()

			// エラーメッセージが表示される
			await vi.waitFor(
				async () => {
					await expect
						.element(page.getByText(/回答に失敗しました/))
						.toBeInTheDocument()
				},
				{ timeout: 3000 },
			)
		})
	})

	describe('参加者サマリー表示', () => {
		it('参加予定人数がある場合に表示される', async () => {
			const matching = createMockMatching({
				participantSummary: {
					requestedCount: 3,
					acceptedCount: 2,
					joinedCount: 0,
				},
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			await expect.element(page.getByText('参加予定: 2人')).toBeInTheDocument()
		})

		it('合流済み人数がある場合に表示される', async () => {
			const matching = createMockMatching({
				participantSummary: {
					requestedCount: 3,
					acceptedCount: 3,
					joinedCount: 1,
				},
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			await expect.element(page.getByText('合流済み: 1人')).toBeInTheDocument()
		})

		it('参加予定・合流済みが0人の場合は表示されない', async () => {
			const matching = createMockMatching({
				participantSummary: {
					requestedCount: 3,
					acceptedCount: 0,
					joinedCount: 0,
				},
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 募集人数のみ表示される
			await expect.element(page.getByText('募集: 3人')).toBeInTheDocument()

			// 参加予定と合流済みは表示されない
			const acceptedBadge = page.getByText('参加予定: 0人')
			await expect.element(acceptedBadge).not.toBeInTheDocument()
		})
	})

	describe('合流ボタン表示条件', () => {
		it('participantStatus=accepted かつ status=accepted で合流ボタンが表示される', async () => {
			const matching = createMockMatching({
				participantStatus: 'accepted',
				status: 'accepted',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			await expect
				.element(page.getByRole('button', { name: '合流' }))
				.toBeInTheDocument()
		})

		it('participantStatus=accepted かつ status=pending で合流ボタンが表示されない', async () => {
			const matching = createMockMatching({
				participantStatus: 'accepted',
				status: 'pending', // マッチングがまだ成立していない
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 合流ボタンが存在しないことを確認
			const startButton = page.getByRole('button', { name: '合流' })
			await expect.element(startButton).not.toBeInTheDocument()
		})

		it('participantStatus=pending かつ status=accepted で合流ボタンが表示されない', async () => {
			const matching = createMockMatching({
				participantStatus: 'pending', // キャストがまだ回答していない
				status: 'accepted',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 合流ボタンが存在しないことを確認
			const startButton = page.getByRole('button', { name: '合流' })
			await expect.element(startButton).not.toBeInTheDocument()
		})

		it('participantStatus=joined で合流ボタンが表示されない', async () => {
			const matching = createMockMatching({
				participantStatus: 'joined', // 既に合流済み
				status: 'in_progress',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 合流ボタンが存在しないことを確認
			const startButton = page.getByRole('button', { name: '合流' })
			await expect.element(startButton).not.toBeInTheDocument()
		})
	})

	describe('合流操作', () => {
		it('合流ボタンをクリックするとAPIが呼ばれる', async () => {
			mockFetch.mockImplementation(() => {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						groupMatching: createMockMatching({
							participantStatus: 'joined',
							status: 'in_progress',
						}),
					}),
				} as Response)
			})

			const matching = createMockMatching({
				participantStatus: 'accepted',
				status: 'accepted',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 合流ボタンをクリック
			const startButton = page.getByRole('button', { name: '合流' })
			await startButton.click()

			// API呼び出しを待つ
			await vi.waitFor(
				() => {
					expect(mockFetch).toHaveBeenCalled()
					// リクエストURLを検証
					const [url, options] = mockFetch.mock.calls[0]
					expect(url).toContain('/api/group-matchings/cast/matching-123/start')
					expect(options.method).toBe('PATCH')
				},
				{ timeout: 3000 },
			)
		})

		it('API処理中は合流ボタンがdisabledになる', async () => {
			let resolvePromise: (value: Response) => void = () => {}
			const pendingPromise = new Promise<Response>((resolve) => {
				resolvePromise = resolve
			})

			mockFetch.mockReturnValue(pendingPromise)

			const matching = createMockMatching({
				participantStatus: 'accepted',
				status: 'accepted',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 合流ボタンをクリック
			const startButton = page.getByRole('button', { name: '合流' })
			await startButton.click()

			// ボタンがdisabledになる
			await vi.waitFor(async () => {
				await expect
					.element(page.getByRole('button', { name: '合流' }))
					.toBeDisabled()
			})

			// 後処理: Promiseを解決
			resolvePromise({
				ok: true,
				json: async () => ({
					success: true,
					groupMatching: createMockMatching({
						participantStatus: 'joined',
						status: 'in_progress',
					}),
				}),
			} as Response)
		})

		it('APIエラー時にエラーメッセージが表示される', async () => {
			mockFetch.mockImplementation(() => {
				return Promise.resolve({
					ok: false,
					json: async () => ({
						success: false,
						error: 'マッチングの開始に失敗しました',
					}),
				} as Response)
			})

			const matching = createMockMatching({
				participantStatus: 'accepted',
				status: 'accepted',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 合流ボタンをクリック
			const startButton = page.getByRole('button', { name: '合流' })
			await startButton.click()

			// エラーメッセージが表示される
			await vi.waitFor(
				async () => {
					await expect
						.element(page.getByText(/マッチングの開始に失敗しました/))
						.toBeInTheDocument()
				},
				{ timeout: 3000 },
			)
		})
	})

	describe('終了ボタン表示条件', () => {
		it('participantStatus=joined かつ status=in_progress で終了ボタンが表示される', async () => {
			const matching = createMockMatching({
				participantStatus: 'joined',
				status: 'in_progress',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			await expect
				.element(page.getByRole('button', { name: '終了' }))
				.toBeInTheDocument()
		})

		it('participantStatus=joined かつ status=accepted で終了ボタンが表示されない', async () => {
			const matching = createMockMatching({
				participantStatus: 'joined',
				status: 'accepted', // in_progressではない
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 終了ボタンが存在しないことを確認
			const endButton = page.getByRole('button', { name: '終了' })
			await expect.element(endButton).not.toBeInTheDocument()
		})

		it('participantStatus=accepted かつ status=in_progress で終了ボタンが表示されない', async () => {
			const matching = createMockMatching({
				participantStatus: 'accepted', // joinedではない
				status: 'in_progress',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 終了ボタンが存在しないことを確認
			const endButton = page.getByRole('button', { name: '終了' })
			await expect.element(endButton).not.toBeInTheDocument()
		})

		it('participantStatus=completed で終了ボタンが表示されない', async () => {
			const matching = createMockMatching({
				participantStatus: 'completed', // 既に完了済み
				status: 'in_progress',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 終了ボタンが存在しないことを確認
			const endButton = page.getByRole('button', { name: '終了' })
			await expect.element(endButton).not.toBeInTheDocument()
		})
	})

	describe('終了操作', () => {
		it('終了ボタンをクリックするとAPIが呼ばれる', async () => {
			mockFetch.mockImplementation(() => {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						groupMatching: createMockMatching({
							participantStatus: 'completed',
							status: 'in_progress',
						}),
					}),
				} as Response)
			})

			const matching = createMockMatching({
				participantStatus: 'joined',
				status: 'in_progress',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 終了ボタンをクリック
			const endButton = page.getByRole('button', { name: '終了' })
			await endButton.click()

			// API呼び出しを待つ
			await vi.waitFor(
				() => {
					expect(mockFetch).toHaveBeenCalled()
					// リクエストURLを検証
					const [url, options] = mockFetch.mock.calls[0]
					expect(url).toContain('/api/group-matchings/cast/matching-123/end')
					expect(options.method).toBe('PATCH')
				},
				{ timeout: 3000 },
			)
		})

		it('API処理中は終了ボタンがdisabledになる', async () => {
			let resolvePromise: (value: Response) => void = () => {}
			const pendingPromise = new Promise<Response>((resolve) => {
				resolvePromise = resolve
			})

			mockFetch.mockReturnValue(pendingPromise)

			const matching = createMockMatching({
				participantStatus: 'joined',
				status: 'in_progress',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 終了ボタンをクリック
			const endButton = page.getByRole('button', { name: '終了' })
			await endButton.click()

			// ボタンがdisabledになる
			await vi.waitFor(async () => {
				await expect
					.element(page.getByRole('button', { name: '終了' }))
					.toBeDisabled()
			})

			// 後処理: Promiseを解決
			resolvePromise({
				ok: true,
				json: async () => ({
					success: true,
					groupMatching: createMockMatching({
						participantStatus: 'completed',
						status: 'in_progress',
					}),
				}),
			} as Response)
		})

		it('APIエラー時にエラーメッセージが表示される', async () => {
			mockFetch.mockImplementation(() => {
				return Promise.resolve({
					ok: false,
					json: async () => ({
						success: false,
						error: 'マッチングの終了に失敗しました',
					}),
				} as Response)
			})

			const matching = createMockMatching({
				participantStatus: 'joined',
				status: 'in_progress',
			})

			render(
				<TestWrapper>
					<CastGroupMatchingStatusCard matching={matching} />
				</TestWrapper>,
			)

			// 終了ボタンをクリック
			const endButton = page.getByRole('button', { name: '終了' })
			await endButton.click()

			// エラーメッセージが表示される
			await vi.waitFor(
				async () => {
					await expect
						.element(page.getByText(/マッチングの終了に失敗しました/))
						.toBeInTheDocument()
				},
				{ timeout: 3000 },
			)
		})
	})
})
