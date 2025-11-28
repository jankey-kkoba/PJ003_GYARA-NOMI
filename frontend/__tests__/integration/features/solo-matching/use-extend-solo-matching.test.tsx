/**
 * useExtendSoloMatching hook 統合テスト
 *
 * ソロマッチング延長フックの動作を検証
 * API呼び出し、エラーハンドリング、成功時の処理をテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useExtendSoloMatching } from '@/features/solo-matching/hooks/useExtendSoloMatching'
import type { ExtendSoloMatchingParams } from '@/features/solo-matching/hooks/useExtendSoloMatching'

// Fetch APIのモック
const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

let queryClient: QueryClient

// テスト用のコンポーネント（hook の値を表示し、mutate を実行できる）
function TestComponent({
	params,
	onSuccess,
	onError,
}: {
	params?: ExtendSoloMatchingParams
	onSuccess?: (data: unknown) => void
	onError?: (error: Error) => void
}) {
	const { mutate, isPending, isSuccess, isError, data, error } =
		useExtendSoloMatching()

	return (
		<div>
			<div data-testid="isPending">{String(isPending)}</div>
			<div data-testid="isSuccess">{String(isSuccess)}</div>
			<div data-testid="isError">{String(isError)}</div>
			<div data-testid="data">{data ? JSON.stringify(data) : 'null'}</div>
			<div data-testid="error">{error ? error.message : 'null'}</div>
			<button
				onClick={() => {
					if (params) {
						mutate(params, { onSuccess, onError })
					}
				}}
				data-testid="mutate-btn"
			>
				Mutate
			</button>
		</div>
	)
}

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}

describe('useExtendSoloMatching', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})
	})

	describe('正常系', () => {
		it('マッチングを延長できる', async () => {
			const params: ExtendSoloMatchingParams = {
				matchingId: 'matching-123',
				extensionMinutes: 30,
			}

			const mockSoloMatching = {
				id: 'matching-123',
				guestId: 'guest-123',
				castId: 'cast-123',
				chatRoomId: null,
				status: 'in_progress' as const,
				proposedDate: new Date('2025-11-28T17:00:00Z'),
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 5000,
				totalPoints: 12500,
				startedAt: new Date('2025-11-28T17:00:00Z'),
				scheduledEndAt: new Date('2025-11-28T19:30:00Z'),
				extensionMinutes: 30,
				extensionPoints: 2500,
			}

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					soloMatching: mockSoloMatching,
				}),
			} as Response)

			render(
				<TestWrapper>
					<TestComponent params={params} />
				</TestWrapper>,
			)

			// mutateボタンをクリック
			await page.getByTestId('mutate-btn').click()

			// 成功を待つ
			await vi.waitFor(async () => {
				await expect
					.element(page.getByTestId('isSuccess'))
					.toHaveTextContent('true')
			})

			expect(mockFetch).toHaveBeenCalledWith(
				'/api/solo-matchings/guest/matching-123/extend',
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ extensionMinutes: 30 }),
				},
			)
		})

		it('60分延長できる', async () => {
			const params: ExtendSoloMatchingParams = {
				matchingId: 'matching-456',
				extensionMinutes: 60,
			}

			const mockSoloMatching = {
				id: 'matching-456',
				guestId: 'guest-456',
				castId: 'cast-456',
				chatRoomId: null,
				status: 'in_progress' as const,
				proposedDate: new Date('2025-11-28T17:00:00Z'),
				proposedDuration: 120,
				proposedLocation: '新宿',
				hourlyRate: 4000,
				totalPoints: 12000,
				startedAt: new Date('2025-11-28T17:00:00Z'),
				scheduledEndAt: new Date('2025-11-28T20:00:00Z'),
				extensionMinutes: 60,
				extensionPoints: 4000,
			}

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					soloMatching: mockSoloMatching,
				}),
			} as Response)

			render(
				<TestWrapper>
					<TestComponent params={params} />
				</TestWrapper>,
			)

			// mutateボタンをクリック
			await page.getByTestId('mutate-btn').click()

			// 成功を待つ
			await vi.waitFor(async () => {
				await expect
					.element(page.getByTestId('isSuccess'))
					.toHaveTextContent('true')
			})

			expect(mockFetch).toHaveBeenCalledWith(
				'/api/solo-matchings/guest/matching-456/extend',
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ extensionMinutes: 60 }),
				},
			)
		})

		it('onSuccessコールバックが呼ばれる', async () => {
			const params: ExtendSoloMatchingParams = {
				matchingId: 'matching-789',
				extensionMinutes: 30,
			}

			const mockSoloMatching = {
				id: 'matching-789',
				guestId: 'guest-789',
				castId: 'cast-789',
				chatRoomId: null,
				status: 'in_progress' as const,
				proposedDate: new Date('2025-11-28T17:00:00Z'),
				proposedDuration: 90,
				proposedLocation: '六本木',
				hourlyRate: 5000,
				totalPoints: 10000,
				startedAt: new Date('2025-11-28T17:00:00Z'),
				scheduledEndAt: new Date('2025-11-28T19:00:00Z'),
				extensionMinutes: 30,
				extensionPoints: 2500,
			}

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					soloMatching: mockSoloMatching,
				}),
			} as Response)

			const onSuccess = vi.fn()

			render(
				<TestWrapper>
					<TestComponent params={params} onSuccess={onSuccess} />
				</TestWrapper>,
			)

			// mutateボタンをクリック
			await page.getByTestId('mutate-btn').click()

			// onSuccessが呼ばれるのを待つ
			await vi.waitFor(() => {
				expect(onSuccess).toHaveBeenCalled()
			})
		})
	})

	describe('エラーハンドリング', () => {
		it('APIエラー時にエラー状態になる', async () => {
			const params: ExtendSoloMatchingParams = {
				matchingId: 'invalid-matching',
				extensionMinutes: 30,
			}

			mockFetch.mockResolvedValue({
				ok: false,
				json: async () => ({
					error: 'マッチングが見つかりません',
				}),
			} as Response)

			render(
				<TestWrapper>
					<TestComponent params={params} />
				</TestWrapper>,
			)

			// mutateボタンをクリック
			await page.getByTestId('mutate-btn').click()

			// エラー状態を待つ
			await vi.waitFor(async () => {
				await expect
					.element(page.getByTestId('isError'))
					.toHaveTextContent('true')
			})

			await expect
				.element(page.getByTestId('error'))
				.toHaveTextContent('マッチングが見つかりません')
		})

		it('ネットワークエラー時にデフォルトエラーメッセージを表示', async () => {
			const params: ExtendSoloMatchingParams = {
				matchingId: 'matching-123',
				extensionMinutes: 30,
			}

			mockFetch.mockResolvedValue({
				ok: false,
				json: async () => ({}),
			} as Response)

			render(
				<TestWrapper>
					<TestComponent params={params} />
				</TestWrapper>,
			)

			// mutateボタンをクリック
			await page.getByTestId('mutate-btn').click()

			// エラー状態を待つ
			await vi.waitFor(async () => {
				await expect
					.element(page.getByTestId('isError'))
					.toHaveTextContent('true')
			})

			await expect
				.element(page.getByTestId('error'))
				.toHaveTextContent('マッチングの延長に失敗しました')
		})

		it('onErrorコールバックが呼ばれる', async () => {
			const params: ExtendSoloMatchingParams = {
				matchingId: 'matching-123',
				extensionMinutes: 30,
			}

			mockFetch.mockResolvedValue({
				ok: false,
				json: async () => ({
					error: 'サーバーエラー',
				}),
			} as Response)

			const onError = vi.fn()

			render(
				<TestWrapper>
					<TestComponent params={params} onError={onError} />
				</TestWrapper>,
			)

			// mutateボタンをクリック
			await page.getByTestId('mutate-btn').click()

			// onErrorが呼ばれるのを待つ
			await vi.waitFor(() => {
				expect(onError).toHaveBeenCalled()
			})
		})
	})

	describe('ローディング状態', () => {
		it('送信中はisPendingがtrueになる', async () => {
			const params: ExtendSoloMatchingParams = {
				matchingId: 'matching-123',
				extensionMinutes: 30,
			}

			let resolvePromise: (value: Response) => void = () => {}
			const pendingPromise = new Promise<Response>((resolve) => {
				resolvePromise = resolve
			})

			mockFetch.mockReturnValue(pendingPromise)

			render(
				<TestWrapper>
					<TestComponent params={params} />
				</TestWrapper>,
			)

			// mutateボタンをクリック
			await page.getByTestId('mutate-btn').click()

			// isPendingがtrueになるのを待つ
			await vi.waitFor(async () => {
				await expect
					.element(page.getByTestId('isPending'))
					.toHaveTextContent('true')
			})

			// 後処理: Promiseを解決してテストをクリーンアップ
			resolvePromise({
				ok: true,
				json: async () => ({
					success: true,
					soloMatching: {
						id: 'matching-123',
						guestId: 'guest-123',
						castId: 'cast-123',
						status: 'in_progress',
						proposedDate: new Date('2025-11-28T17:00:00Z'),
						proposedDuration: 120,
						proposedLocation: '渋谷',
						hourlyRate: 5000,
						totalPoints: 12500,
						startedAt: new Date('2025-11-28T17:00:00Z'),
						scheduledEndAt: new Date('2025-11-28T19:30:00Z'),
						extensionMinutes: 30,
						extensionPoints: 2500,
					},
				}),
			} as Response)
		})
	})
})
