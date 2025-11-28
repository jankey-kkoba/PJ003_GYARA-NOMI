/**
 * useCompleteSoloMatching hook 統合テスト
 *
 * ソロマッチング終了フックの動作を検証
 * API呼び出し、エラーハンドリング、成功時の処理をテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCompleteSoloMatching } from '@/features/solo-matching/hooks/useCompleteSoloMatching'
import type { CompleteSoloMatchingParams } from '@/features/solo-matching/hooks/useCompleteSoloMatching'

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
	params?: CompleteSoloMatchingParams
	onSuccess?: (data: unknown) => void
	onError?: (error: Error) => void
}) {
	const { mutate, isPending, isSuccess, isError, data, error } =
		useCompleteSoloMatching()

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

describe('useCompleteSoloMatching', () => {
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
		it('マッチングを終了できる', async () => {
			const params: CompleteSoloMatchingParams = {
				matchingId: 'matching-123',
			}

			const mockSoloMatching = {
				id: 'matching-123',
				guestId: 'guest-123',
				castId: 'cast-123',
				chatRoomId: null,
				status: 'completed' as const,
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
				totalPoints: 6000,
				actualEndAt: new Date(),
			}

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					matching: mockSoloMatching,
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
				'/api/solo-matchings/cast/matching-123/end',
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
				},
			)
		})

		it('onSuccessコールバックが呼ばれる', async () => {
			const params: CompleteSoloMatchingParams = {
				matchingId: 'matching-456',
			}

			const mockSoloMatching = {
				id: 'matching-456',
				guestId: 'guest-456',
				castId: 'cast-456',
				chatRoomId: null,
				status: 'completed' as const,
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 90,
				proposedLocation: '新宿',
				hourlyRate: 4000,
				totalPoints: 6000,
				actualEndAt: new Date(),
			}

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					matching: mockSoloMatching,
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
			const params: CompleteSoloMatchingParams = {
				matchingId: 'invalid-matching',
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
			const params: CompleteSoloMatchingParams = {
				matchingId: 'matching-123',
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
				.toHaveTextContent('マッチングの終了に失敗しました')
		})

		it('onErrorコールバックが呼ばれる', async () => {
			const params: CompleteSoloMatchingParams = {
				matchingId: 'matching-123',
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
			const params: CompleteSoloMatchingParams = {
				matchingId: 'matching-123',
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
					matching: {
						id: 'matching-123',
						guestId: 'guest-123',
						castId: 'cast-123',
						status: 'completed',
						proposedDate: new Date(Date.now() + 86400000),
						proposedDuration: 120,
						proposedLocation: '渋谷',
						hourlyRate: 3000,
						totalPoints: 6000,
						actualEndAt: new Date(),
					},
				}),
			} as Response)
		})
	})
})
