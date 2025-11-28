/**
 * FavoriteButton コンポーネント統合テスト
 *
 * お気に入りボタンのUI操作、状態表示、ローディング状態を検証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Hono クライアントのモック
const mockGet = vi.fn()
const mockPost = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/libs/hono/client', () => ({
	favoritesClient: {
		api: {
			favorites: {
				':castId': {
					$get: mockGet,
					$post: mockPost,
					$delete: mockDelete,
				},
			},
		},
	},
}))

// モック後にインポート
const { FavoriteButton } =
	await import('@/features/favorite/components/atoms/FavoriteButton')

let queryClient: QueryClient

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}

describe('FavoriteButton', () => {
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
		it('ローディング中はボタンがdisabledになる', async () => {
			mockGet.mockImplementation(() => new Promise(() => {}))

			render(
				<TestWrapper>
					<FavoriteButton castId="cast-123" />
				</TestWrapper>,
			)

			const button = page.getByRole('button')
			await expect.element(button).toBeDisabled()
		})

		it('お気に入り登録済みの場合は「お気に入りから削除」ラベルを表示', async () => {
			mockGet.mockResolvedValue({
				ok: true,
				json: async () => ({ success: true, data: { isFavorite: true } }),
			})

			render(
				<TestWrapper>
					<FavoriteButton castId="cast-123" />
				</TestWrapper>,
			)

			await expect
				.element(page.getByRole('button', { name: 'お気に入りから削除' }))
				.toBeInTheDocument()
		})

		it('お気に入り未登録の場合は「お気に入りに追加」ラベルを表示', async () => {
			mockGet.mockResolvedValue({
				ok: true,
				json: async () => ({ success: true, data: { isFavorite: false } }),
			})

			render(
				<TestWrapper>
					<FavoriteButton castId="cast-456" />
				</TestWrapper>,
			)

			await expect
				.element(page.getByRole('button', { name: 'お気に入りに追加' }))
				.toBeInTheDocument()
		})
	})

	describe('クリック操作', () => {
		it('未登録状態でクリックするとお気に入りに追加される', async () => {
			mockGet.mockResolvedValue({
				ok: true,
				json: async () => ({ success: true, data: { isFavorite: false } }),
			})
			mockPost.mockResolvedValue({
				ok: true,
				json: async () => ({ success: true, data: { isFavorite: true } }),
			})

			render(
				<TestWrapper>
					<FavoriteButton castId="cast-123" />
				</TestWrapper>,
			)

			// 初期状態を確認
			await expect
				.element(page.getByRole('button', { name: 'お気に入りに追加' }))
				.toBeInTheDocument()

			// クリック
			await page.getByRole('button').click()

			// POSTが呼ばれる
			await vi.waitFor(() => {
				expect(mockPost).toHaveBeenCalledWith({ param: { castId: 'cast-123' } })
			})

			// 状態が更新される
			await expect
				.element(page.getByRole('button', { name: 'お気に入りから削除' }))
				.toBeInTheDocument()
		})

		it('登録済み状態でクリックするとお気に入りから削除される', async () => {
			mockGet.mockResolvedValue({
				ok: true,
				json: async () => ({ success: true, data: { isFavorite: true } }),
			})
			mockDelete.mockResolvedValue({
				ok: true,
				json: async () => ({ success: true, data: { isFavorite: false } }),
			})

			render(
				<TestWrapper>
					<FavoriteButton castId="cast-123" />
				</TestWrapper>,
			)

			// 初期状態を確認
			await expect
				.element(page.getByRole('button', { name: 'お気に入りから削除' }))
				.toBeInTheDocument()

			// クリック
			await page.getByRole('button').click()

			// DELETEが呼ばれる
			await vi.waitFor(() => {
				expect(mockDelete).toHaveBeenCalledWith({
					param: { castId: 'cast-123' },
				})
			})

			// 状態が更新される
			await expect
				.element(page.getByRole('button', { name: 'お気に入りに追加' }))
				.toBeInTheDocument()
		})
	})

	describe('ローディング状態', () => {
		it('追加処理中はボタンがdisabledになる', async () => {
			mockGet.mockResolvedValue({
				ok: true,
				json: async () => ({ success: true, data: { isFavorite: false } }),
			})
			// 遅延するPromise
			mockPost.mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(
							() =>
								resolve({
									ok: true,
									json: async () => ({
										success: true,
										data: { isFavorite: true },
									}),
								}),
							100,
						),
					),
			)

			render(
				<TestWrapper>
					<FavoriteButton castId="cast-123" />
				</TestWrapper>,
			)

			// 初期状態を待つ
			await expect
				.element(page.getByRole('button', { name: 'お気に入りに追加' }))
				.toBeInTheDocument()

			// クリック
			await page.getByRole('button').click()

			// 処理中はdisabled
			await expect.element(page.getByRole('button')).toBeDisabled()
		})
	})

	describe('イベント伝播', () => {
		it('クリックイベントが親要素に伝播しない', async () => {
			const parentClickHandler = vi.fn()

			mockGet.mockResolvedValue({
				ok: true,
				json: async () => ({ success: true, data: { isFavorite: false } }),
			})
			mockPost.mockResolvedValue({
				ok: true,
				json: async () => ({ success: true, data: { isFavorite: true } }),
			})

			render(
				<TestWrapper>
					<div onClick={parentClickHandler} data-testid="parent">
						<FavoriteButton castId="cast-123" />
					</div>
				</TestWrapper>,
			)

			// 初期状態を待つ
			await expect
				.element(page.getByRole('button', { name: 'お気に入りに追加' }))
				.toBeInTheDocument()

			// クリック
			await page.getByRole('button').click()

			// 親のクリックハンドラが呼ばれない
			expect(parentClickHandler).not.toHaveBeenCalled()
		})
	})

	describe('カスタムスタイル', () => {
		it('classNameを渡すとボタンに適用される', async () => {
			mockGet.mockResolvedValue({
				ok: true,
				json: async () => ({ success: true, data: { isFavorite: false } }),
			})

			render(
				<TestWrapper>
					<FavoriteButton castId="cast-123" className="custom-class" />
				</TestWrapper>,
			)

			await expect
				.element(page.getByRole('button', { name: 'お気に入りに追加' }))
				.toBeInTheDocument()

			const button = page.getByRole('button')
			await expect.element(button).toHaveClass('custom-class')
		})
	})
})
