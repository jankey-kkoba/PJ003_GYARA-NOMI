/**
 * CastReviewForm コンポーネント統合テスト
 *
 * キャスト評価フォームのUI操作、バリデーション、送信を検証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Hono クライアントのモック
const mockPost = vi.fn()

vi.mock('@/libs/hono/client', () => ({
	castReviewsClient: {
		api: {
			'cast-reviews': {
				$post: mockPost,
			},
		},
	},
}))

// モック後にインポート
const { CastReviewForm } =
	await import('@/features/cast-review/components/organisms/CastReviewForm')

let queryClient: QueryClient

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}

describe('CastReviewForm', () => {
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
		it('評価フォームが正しく表示される', async () => {
			render(
				<TestWrapper>
					<CastReviewForm matchingId="matching-123" />
				</TestWrapper>,
			)

			// 5つの星ボタンが表示される（1星から5星まで）
			await expect
				.element(page.getByRole('button', { name: '1星' }))
				.toBeInTheDocument()
			await expect
				.element(page.getByRole('button', { name: '5星' }))
				.toBeInTheDocument()

			// コメント入力欄が表示される
			await expect
				.element(page.getByText('コメント（任意）'))
				.toBeInTheDocument()

			// 送信ボタンが表示される（初期状態ではdisabled）
			await expect
				.element(page.getByRole('button', { name: '評価を送信' }))
				.toBeDisabled()
		})

		it('初期状態では送信ボタンが無効', async () => {
			render(
				<TestWrapper>
					<CastReviewForm matchingId="matching-123" />
				</TestWrapper>,
			)

			const submitButton = page.getByRole('button', { name: '評価を送信' })
			await expect.element(submitButton).toBeDisabled()
		})
	})

	describe('星評価操作', () => {
		it('星をクリックすると評価が変更される', async () => {
			render(
				<TestWrapper>
					<CastReviewForm matchingId="matching-123" />
				</TestWrapper>,
			)

			// 3星をクリック
			const star3 = page.getByRole('button', { name: '3星' })
			await star3.click()

			// 送信ボタンが有効になる
			const submitButton = page.getByRole('button', { name: '評価を送信' })
			await expect.element(submitButton).not.toBeDisabled()
		})

		it('5星をクリックすると送信可能になる', async () => {
			render(
				<TestWrapper>
					<CastReviewForm matchingId="matching-123" />
				</TestWrapper>,
			)

			// 5星をクリック
			const star5 = page.getByRole('button', { name: '5星' })
			await star5.click()

			// 送信ボタンが有効になる
			const submitButton = page.getByRole('button', { name: '評価を送信' })
			await expect.element(submitButton).not.toBeDisabled()
		})
	})

	describe('フォーム送信', () => {
		it('評価とコメントを送信できる', async () => {
			mockPost.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					data: {
						id: 'review-123',
						matchingId: 'matching-123',
						rating: 5,
						comment: 'とても楽しかったです',
					},
				}),
			})

			render(
				<TestWrapper>
					<CastReviewForm matchingId="matching-123" />
				</TestWrapper>,
			)

			// 5星をクリック
			const star5 = page.getByRole('button', { name: '5星' })
			await star5.click()

			// コメントを入力
			const textarea = page.getByPlaceholder(
				'キャストへの感想やコメントがあればご記入ください',
			)
			await textarea.fill('とても楽しかったです')

			// 送信
			const submitButton = page.getByRole('button', { name: '評価を送信' })
			await submitButton.click()

			// APIが呼ばれる
			await vi.waitFor(() => {
				expect(mockPost).toHaveBeenCalledWith({
					json: {
						matchingId: 'matching-123',
						rating: 5,
						comment: 'とても楽しかったです',
					},
				})
			})
		})

		it('コメントなしで送信できる', async () => {
			mockPost.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					data: {
						id: 'review-123',
						matchingId: 'matching-123',
						rating: 4,
						comment: '',
					},
				}),
			})

			render(
				<TestWrapper>
					<CastReviewForm matchingId="matching-123" />
				</TestWrapper>,
			)

			// 4星をクリック
			const star4 = page.getByRole('button', { name: '4星' })
			await star4.click()

			// 送信（コメントなし）
			const submitButton = page.getByRole('button', { name: '評価を送信' })
			await submitButton.click()

			// APIが呼ばれる
			await vi.waitFor(() => {
				expect(mockPost).toHaveBeenCalledWith({
					json: {
						matchingId: 'matching-123',
						rating: 4,
						comment: '',
					},
				})
			})
		})

		it('onSuccessコールバックが呼ばれる', async () => {
			const onSuccess = vi.fn()
			mockPost.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					data: {
						id: 'review-123',
						matchingId: 'matching-123',
						rating: 5,
						comment: '',
					},
				}),
			})

			render(
				<TestWrapper>
					<CastReviewForm matchingId="matching-123" onSuccess={onSuccess} />
				</TestWrapper>,
			)

			// 5星をクリック
			const star5 = page.getByRole('button', { name: '5星' })
			await star5.click()

			// 送信
			const submitButton = page.getByRole('button', { name: '評価を送信' })
			await submitButton.click()

			// onSuccessが呼ばれる
			await vi.waitFor(() => {
				expect(onSuccess).toHaveBeenCalled()
			})
		})
	})

	describe('送信中状態', () => {
		it('送信中はボタンが「送信中...」と表示されdisabledになる', async () => {
			mockPost.mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(
							() =>
								resolve({
									ok: true,
									json: async () => ({
										success: true,
										data: { id: 'review-123' },
									}),
								}),
							100,
						),
					),
			)

			render(
				<TestWrapper>
					<CastReviewForm matchingId="matching-123" />
				</TestWrapper>,
			)

			// 5星をクリック
			const star5 = page.getByRole('button', { name: '5星' })
			await star5.click()

			// 送信
			const submitButton = page.getByRole('button', { name: '評価を送信' })
			await submitButton.click()

			// 送信中の状態
			await expect
				.element(page.getByRole('button', { name: '送信中...' }))
				.toBeDisabled()
		})

		it('送信中は星評価ボタンがdisabledになる', async () => {
			mockPost.mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(
							() =>
								resolve({
									ok: true,
									json: async () => ({
										success: true,
										data: { id: 'review-123' },
									}),
								}),
							100,
						),
					),
			)

			render(
				<TestWrapper>
					<CastReviewForm matchingId="matching-123" />
				</TestWrapper>,
			)

			// 5星をクリック
			const star5 = page.getByRole('button', { name: '5星' })
			await star5.click()

			// 送信
			const submitButton = page.getByRole('button', { name: '評価を送信' })
			await submitButton.click()

			// 星ボタンがdisabled
			await expect
				.element(page.getByRole('button', { name: '1星' }))
				.toBeDisabled()
		})
	})
})
