/**
 * CastDetailTemplate コンポーネント統合テスト
 *
 * Testing Trophy の Integration テストとして、
 * データ取得、レンダリング、ローディング状態、エラー状態を検証する
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// next/navigation のモック
vi.mock('next/navigation', () => ({
	useRouter: () => ({
		back: vi.fn(),
		push: vi.fn(),
	}),
}))

// Hono クライアントのモック
const mockGetById = vi.fn()
const mockFavoriteGet = vi.fn()
const mockPhotosGet = vi.fn()

vi.mock('@/libs/hono/client', () => ({
	castsClient: {
		api: {
			casts: {
				':castId': {
					$get: mockGetById,
				},
			},
		},
	},
	favoritesClient: {
		api: {
			favorites: {
				':castId': {
					$get: mockFavoriteGet,
					$post: vi.fn(),
					$delete: vi.fn(),
				},
			},
		},
	},
	photosClient: {
		api: {
			casts: {
				photos: {
					$get: mockPhotosGet,
					$post: vi.fn(),
					$put: vi.fn(),
					$delete: vi.fn(),
				},
			},
		},
	},
}))

// モック後にインポート
const { CastDetailTemplate } =
	await import('@/features/cast/components/organisms/CastDetailTemplate')

/**
 * テスト用の QueryClient を作成
 */
function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	})
}

let queryClient: QueryClient

/**
 * テスト用のラッパーコンポーネント
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}

describe('CastDetailTemplate', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		queryClient = createTestQueryClient()
		// お気に入り状態のデフォルトモック
		mockFavoriteGet.mockResolvedValue({
			ok: true,
			json: async () => ({ success: true, data: { isFavorite: false } }),
		})
		// プロフィール写真のデフォルトモック（写真なし）
		mockPhotosGet.mockResolvedValue({
			ok: true,
			json: async () => ({ success: true, data: [] }),
		})
	})

	describe('ローディング状態', () => {
		it('データ取得中はローディング表示を行う', async () => {
			// 遅延するPromiseでローディング状態を再現
			mockGetById.mockImplementation(() => new Promise(() => {}))

			render(
				<TestWrapper>
					<CastDetailTemplate castId="cast-123" />
				</TestWrapper>,
			)

			// スケルトンが表示されることを確認
			await expect
				.element(page.getByTestId('cast-detail-skeleton'))
				.toBeInTheDocument()
		})
	})

	describe('エラー状態', () => {
		it('API エラー時はエラーメッセージを表示する', async () => {
			mockGetById.mockResolvedValue({
				ok: false,
				json: async () => ({
					success: false,
					error: 'キャスト詳細の取得に失敗しました',
				}),
			})

			render(
				<TestWrapper>
					<CastDetailTemplate castId="cast-123" />
				</TestWrapper>,
			)

			await expect
				.element(page.getByText('キャスト詳細の取得に失敗しました'))
				.toBeInTheDocument()
			await expect
				.element(page.getByRole('button', { name: '戻る' }))
				.toBeInTheDocument()
		})

		it('キャストが見つからない場合はエラーメッセージを表示する', async () => {
			mockGetById.mockResolvedValue({
				ok: false,
				json: async () => ({
					success: false,
					error: 'キャストが見つかりません',
				}),
			})

			render(
				<TestWrapper>
					<CastDetailTemplate castId="nonexistent" />
				</TestWrapper>,
			)

			await expect
				.element(page.getByText('キャストが見つかりません'))
				.toBeInTheDocument()
		})
	})

	describe('正常表示', () => {
		it('キャスト詳細を正しく表示する', async () => {
			const mockCast = {
				id: 'cast-123',
				name: '山田花子',
				age: 25,
				bio: 'よろしくお願いします！楽しい時間を過ごしましょう♪',
				rank: 1,
				areaName: '渋谷',
			}

			mockGetById.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					data: { cast: mockCast },
				}),
			})

			render(
				<TestWrapper>
					<CastDetailTemplate castId="cast-123" />
				</TestWrapper>,
			)

			await expect.element(page.getByText('山田花子')).toBeInTheDocument()
			await expect.element(page.getByText(/25歳/)).toBeInTheDocument()
			await expect.element(page.getByText(/渋谷/)).toBeInTheDocument()
			await expect
				.element(
					page.getByText('よろしくお願いします！楽しい時間を過ごしましょう♪'),
				)
				.toBeInTheDocument()
		})

		it('エリアがnullの場合も正しく表示する', async () => {
			const mockCast = {
				id: 'cast-456',
				name: 'テストキャスト',
				age: 28,
				bio: '自己紹介',
				rank: 2,
				areaName: null,
			}

			mockGetById.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					data: { cast: mockCast },
				}),
			})

			render(
				<TestWrapper>
					<CastDetailTemplate castId="cast-456" />
				</TestWrapper>,
			)

			await expect.element(page.getByText('テストキャスト')).toBeInTheDocument()
			await expect.element(page.getByText('28歳')).toBeInTheDocument()
		})

		it('bioがnullの場合は自己紹介セクションを表示しない', async () => {
			const mockCast = {
				id: 'cast-789',
				name: 'テストキャスト2',
				age: 30,
				bio: null,
				rank: 3,
				areaName: '新宿',
			}

			mockGetById.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					data: { cast: mockCast },
				}),
			})

			render(
				<TestWrapper>
					<CastDetailTemplate castId="cast-789" />
				</TestWrapper>,
			)

			await expect
				.element(page.getByText('テストキャスト2'))
				.toBeInTheDocument()
			// 自己紹介セクションのラベルがないことを確認
			await expect.element(page.getByText('自己紹介')).not.toBeInTheDocument()
		})

		it('戻るボタンが表示される', async () => {
			const mockCast = {
				id: 'cast-123',
				name: 'テストキャスト',
				age: 25,
				bio: '自己紹介',
				rank: 1,
				areaName: '渋谷',
			}

			mockGetById.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					data: { cast: mockCast },
				}),
			})

			render(
				<TestWrapper>
					<CastDetailTemplate castId="cast-123" />
				</TestWrapper>,
			)

			await expect.element(page.getByText('← 一覧に戻る')).toBeInTheDocument()
		})
	})

	describe('データ取得', () => {
		it('正しいパラメータでAPIを呼び出す', async () => {
			const mockCast = {
				id: 'cast-999',
				name: 'テストキャスト',
				age: 25,
				bio: '自己紹介',
				rank: 1,
				areaName: '渋谷',
			}

			mockGetById.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					data: { cast: mockCast },
				}),
			})

			render(
				<TestWrapper>
					<CastDetailTemplate castId="cast-999" />
				</TestWrapper>,
			)

			await expect.element(page.getByText('テストキャスト')).toBeInTheDocument()

			expect(mockGetById).toHaveBeenCalledTimes(1)
			expect(mockGetById).toHaveBeenCalledWith({
				param: { castId: 'cast-999' },
			})
		})
	})
})
