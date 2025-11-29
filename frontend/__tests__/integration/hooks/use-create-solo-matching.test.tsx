/**
 * useCreateSoloMatching hook 統合テスト
 *
 * ソロマッチングオファー作成フックの動作を検証
 * API呼び出し、エラーハンドリング、成功時の処理をテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCreateSoloMatching } from '@/features/solo-matching/hooks/useCreateSoloMatching'
import type { CreateSoloMatchingInput } from '@/features/solo-matching/schemas/createSoloMatching'

// Toast のモック
const mockShowToast = vi.fn()
vi.mock('@/hooks/useToast', () => ({
	useToast: () => ({
		showToast: mockShowToast,
	}),
}))

// Fetch APIのモック
const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

let queryClient: QueryClient

// テスト用のコンポーネント（hook の値を表示し、mutate を実行できる）
function TestComponent({
	input,
	onSuccess,
	onError,
}: {
	input?: CreateSoloMatchingInput
	onSuccess?: (data: unknown) => void
	onError?: (error: Error) => void
}) {
	const { mutate, isPending, isSuccess, isError, data, error } =
		useCreateSoloMatching()

	return (
		<div>
			<div data-testid="isPending">{String(isPending)}</div>
			<div data-testid="isSuccess">{String(isSuccess)}</div>
			<div data-testid="isError">{String(isError)}</div>
			<div data-testid="data">{data ? JSON.stringify(data) : 'null'}</div>
			<div data-testid="error">{error ? error.message : 'null'}</div>
			<button
				onClick={() => {
					if (input) {
						mutate(input, { onSuccess, onError })
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

describe('useCreateSoloMatching', () => {
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
		it('マッチングオファーを作成できる', async () => {
			const input: CreateSoloMatchingInput = {
				castId: 'cast-123',
				proposedTimeOffsetMinutes: 60,
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			}

			const mockSoloMatching = {
				id: 'matching-123',
				guestId: 'guest-123',
				castId: 'cast-123',
				chatRoomId: null,
				status: 'pending' as const,
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
				totalPoints: 6000,
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
					<TestComponent input={input} />
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

			expect(mockFetch).toHaveBeenCalledWith('/api/solo-matchings/guest', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(input),
			})
		})

		it('onSuccessコールバックが呼ばれる', async () => {
			const input: CreateSoloMatchingInput = {
				castId: 'cast-456',
				proposedTimeOffsetMinutes: 120,
				proposedDuration: 90,
				proposedLocation: '新宿',
				hourlyRate: 4000,
			}

			const mockSoloMatching = {
				id: 'matching-456',
				guestId: 'guest-456',
				castId: 'cast-456',
				chatRoomId: null,
				status: 'pending' as const,
				proposedDate: new Date(Date.now() + 86400000),
				proposedDuration: 90,
				proposedLocation: '新宿',
				hourlyRate: 4000,
				totalPoints: 6000,
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
					<TestComponent input={input} onSuccess={onSuccess} />
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
		it('APIエラー時にトーストでエラーメッセージを表示', async () => {
			const input: CreateSoloMatchingInput = {
				castId: 'invalid-cast',
				proposedTimeOffsetMinutes: 60,
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			}

			mockFetch.mockResolvedValue({
				ok: false,
				json: async () => ({
					error: 'キャストが見つかりません',
				}),
			} as Response)

			render(
				<TestWrapper>
					<TestComponent input={input} />
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

			expect(mockShowToast).toHaveBeenCalledWith(
				'キャストが見つかりません',
				'error',
			)
		})

		it('ネットワークエラー時にデフォルトエラーメッセージを表示', async () => {
			const input: CreateSoloMatchingInput = {
				castId: 'cast-123',
				proposedTimeOffsetMinutes: 60,
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			}

			mockFetch.mockResolvedValue({
				ok: false,
				json: async () => ({}),
			} as Response)

			render(
				<TestWrapper>
					<TestComponent input={input} />
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

			expect(mockShowToast).toHaveBeenCalledWith(
				'マッチングオファーの送信に失敗しました',
				'error',
			)
		})

		it('onErrorコールバックが呼ばれる', async () => {
			const input: CreateSoloMatchingInput = {
				castId: 'cast-123',
				proposedTimeOffsetMinutes: 60,
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
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
					<TestComponent input={input} onError={onError} />
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
			const input: CreateSoloMatchingInput = {
				castId: 'cast-123',
				proposedTimeOffsetMinutes: 60,
				proposedDuration: 120,
				proposedLocation: '渋谷',
				hourlyRate: 3000,
			}

			let resolvePromise: (value: Response) => void = () => {}
			const pendingPromise = new Promise<Response>((resolve) => {
				resolvePromise = resolve
			})

			mockFetch.mockReturnValue(pendingPromise)

			render(
				<TestWrapper>
					<TestComponent input={input} />
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
						status: 'pending',
						proposedDate: new Date(Date.now() + 86400000),
						proposedDuration: 120,
						proposedLocation: '渋谷',
						hourlyRate: 3000,
						totalPoints: 6000,
					},
				}),
			} as Response)
		})
	})
})
