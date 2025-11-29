/**
 * useCastReview hooks 統合テスト
 *
 * キャスト評価の取得・作成のフック動作を検証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Hono クライアントのモック
const mockGet = vi.fn()
const mockPost = vi.fn()

vi.mock('@/libs/hono/client', () => ({
	castReviewsClient: {
		api: {
			'cast-reviews': {
				':matchingId': {
					$get: mockGet,
				},
				$post: mockPost,
			},
		},
	},
}))

// モック後にインポート
const { useCastReview, useCreateCastReview } =
	await import('@/features/cast-review/hooks/useCastReview')

// テスト用コンポーネント（評価取得）
function TestQueryComponent({ matchingId }: { matchingId: string }) {
	const query = useCastReview(matchingId)

	return (
		<div>
			<div data-testid="status">{query.status}</div>
			<div data-testid="isLoading">{String(query.isLoading)}</div>
			<div data-testid="rating">{query.data?.rating ?? 'null'}</div>
			<div data-testid="comment">{query.data?.comment ?? 'null'}</div>
			<div data-testid="error">{query.error?.message ?? 'none'}</div>
		</div>
	)
}

// テスト用コンポーネント（評価作成）
function TestMutationComponent() {
	const createReview = useCreateCastReview()

	return (
		<div>
			<div data-testid="isPending">{String(createReview.isPending)}</div>
			<div data-testid="isSuccess">{String(createReview.isSuccess)}</div>
			<div data-testid="error">{createReview.error?.message ?? 'none'}</div>
			<button
				data-testid="submit-btn"
				onClick={() =>
					createReview.mutate({
						matchingId: 'matching-123',
						rating: 5,
						comment: 'とても良かったです',
					})
				}
			>
				送信
			</button>
			<button
				data-testid="submit-no-comment-btn"
				onClick={() =>
					createReview.mutate({
						matchingId: 'matching-123',
						rating: 4,
					})
				}
			>
				コメントなし送信
			</button>
		</div>
	)
}

let queryClient: QueryClient

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}

describe('useCastReview', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})
	})

	it('評価を取得できる', async () => {
		mockGet.mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				data: {
					id: 'review-123',
					matchingId: 'matching-123',
					guestId: 'guest-123',
					castId: 'cast-123',
					rating: 5,
					comment: 'とても良かったです',
					createdAt: '2024-01-01T00:00:00.000Z',
					updatedAt: '2024-01-01T00:00:00.000Z',
				},
			}),
		})

		render(
			<TestWrapper>
				<TestQueryComponent matchingId="matching-123" />
			</TestWrapper>,
		)

		await expect
			.element(page.getByTestId('status'))
			.toHaveTextContent('success')
		await expect.element(page.getByTestId('rating')).toHaveTextContent('5')
		await expect
			.element(page.getByTestId('comment'))
			.toHaveTextContent('とても良かったです')

		expect(mockGet).toHaveBeenCalledWith({
			param: { matchingId: 'matching-123' },
		})
	})

	it('評価が存在しない場合はnullを返す', async () => {
		mockGet.mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				data: null,
			}),
		})

		render(
			<TestWrapper>
				<TestQueryComponent matchingId="matching-456" />
			</TestWrapper>,
		)

		await expect
			.element(page.getByTestId('status'))
			.toHaveTextContent('success')
		await expect.element(page.getByTestId('rating')).toHaveTextContent('null')
	})

	it('APIエラー時にエラーを返す', async () => {
		mockGet.mockResolvedValue({
			ok: false,
			json: async () => ({ success: false }),
		})

		render(
			<TestWrapper>
				<TestQueryComponent matchingId="matching-789" />
			</TestWrapper>,
		)

		await expect.element(page.getByTestId('status')).toHaveTextContent('error')
		await expect
			.element(page.getByTestId('error'))
			.toHaveTextContent('評価の取得に失敗しました')
	})

	it('matchingIdが空の場合はクエリを実行しない', async () => {
		render(
			<TestWrapper>
				<TestQueryComponent matchingId="" />
			</TestWrapper>,
		)

		// クエリが実行されないのでpending状態のまま
		await expect
			.element(page.getByTestId('status'))
			.toHaveTextContent('pending')
		expect(mockGet).not.toHaveBeenCalled()
	})
})

describe('useCreateCastReview', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})
	})

	it('評価を作成できる', async () => {
		mockPost.mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				data: {
					id: 'review-123',
					matchingId: 'matching-123',
					rating: 5,
					comment: 'とても良かったです',
				},
			}),
		})

		render(
			<TestWrapper>
				<TestMutationComponent />
			</TestWrapper>,
		)

		const submitBtn = page.getByTestId('submit-btn')
		await submitBtn.click()

		await expect
			.element(page.getByTestId('isSuccess'))
			.toHaveTextContent('true')
		expect(mockPost).toHaveBeenCalledWith({
			json: {
				matchingId: 'matching-123',
				rating: 5,
				comment: 'とても良かったです',
			},
		})
	})

	it('コメントなしで評価を作成できる', async () => {
		mockPost.mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				data: {
					id: 'review-123',
					matchingId: 'matching-123',
					rating: 4,
					comment: null,
				},
			}),
		})

		render(
			<TestWrapper>
				<TestMutationComponent />
			</TestWrapper>,
		)

		const submitBtn = page.getByTestId('submit-no-comment-btn')
		await submitBtn.click()

		await expect
			.element(page.getByTestId('isSuccess'))
			.toHaveTextContent('true')
		expect(mockPost).toHaveBeenCalledWith({
			json: {
				matchingId: 'matching-123',
				rating: 4,
			},
		})
	})

	it('送信中はisPendingがtrueになる', async () => {
		mockPost.mockImplementation(
			() => new Promise((resolve) => setTimeout(resolve, 100)),
		)

		render(
			<TestWrapper>
				<TestMutationComponent />
			</TestWrapper>,
		)

		const submitBtn = page.getByTestId('submit-btn')
		await submitBtn.click()

		await expect
			.element(page.getByTestId('isPending'))
			.toHaveTextContent('true')
	})

	it('APIエラー時にエラーを返す', async () => {
		mockPost.mockResolvedValue({
			ok: false,
			json: async () => ({ success: false }),
		})

		render(
			<TestWrapper>
				<TestMutationComponent />
			</TestWrapper>,
		)

		const submitBtn = page.getByTestId('submit-btn')
		await submitBtn.click()

		await expect
			.element(page.getByTestId('error'))
			.toHaveTextContent('評価の送信に失敗しました')
	})
})

describe('キャッシュ更新', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})
	})

	it('評価作成成功時にキャッシュが更新される', async () => {
		// 初期状態: 評価なし
		mockGet.mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				data: null,
			}),
		})
		mockPost.mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				data: {
					id: 'review-123',
					matchingId: 'matching-123',
					rating: 5,
					comment: 'とても良かったです',
				},
			}),
		})

		function CombinedComponent() {
			const query = useCastReview('matching-123')
			const createReview = useCreateCastReview()

			return (
				<div>
					<div data-testid="rating">{query.data?.rating ?? 'null'}</div>
					<button
						data-testid="submit-btn"
						onClick={() =>
							createReview.mutate({
								matchingId: 'matching-123',
								rating: 5,
								comment: 'とても良かったです',
							})
						}
					>
						送信
					</button>
				</div>
			)
		}

		render(
			<TestWrapper>
				<CombinedComponent />
			</TestWrapper>,
		)

		// 初期状態を確認
		await expect.element(page.getByTestId('rating')).toHaveTextContent('null')

		// 評価を作成
		await page.getByTestId('submit-btn').click()

		// invalidateQueriesでキャッシュが更新されるまで待つ
		// mockGetが再度呼ばれる
		await vi.waitFor(() => {
			expect(mockGet).toHaveBeenCalledTimes(2)
		})
	})
})
