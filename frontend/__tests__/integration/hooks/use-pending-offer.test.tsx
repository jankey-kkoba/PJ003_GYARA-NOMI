/**
 * usePendingOffer hook 統合テスト
 *
 * 指定キャストへのpendingオファー取得フックの動作を検証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePendingOffer } from '@/features/solo-matching/hooks/usePendingOffer'

// Fetch APIのモック
const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

// テスト用コンポーネント
function TestComponent({ castId }: { castId: string }) {
	const query = usePendingOffer(castId)

	return (
		<div>
			<div data-testid="status">{query.status}</div>
			<div data-testid="isLoading">{String(query.isLoading)}</div>
			<div data-testid="hasPendingOffer">
				{String(query.data?.hasPendingOffer ?? 'undefined')}
			</div>
			<div data-testid="pendingOfferId">
				{query.data?.pendingOffer?.id ?? 'null'}
			</div>
			<div data-testid="error">{query.error?.message ?? 'none'}</div>
		</div>
	)
}

let queryClient: QueryClient

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}

describe('usePendingOffer', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})
	})

	it('pendingオファーがある場合はオファー情報を取得できる', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				hasPendingOffer: true,
				pendingOffer: {
					id: 'matching-123',
					guestId: 'guest-1',
					castId: 'cast-123',
					status: 'pending',
				},
			}),
		} as Response)

		render(
			<TestWrapper>
				<TestComponent castId="cast-123" />
			</TestWrapper>,
		)

		// データ取得完了を待つ
		await vi.waitFor(
			async () => {
				await expect
					.element(page.getByTestId('status'))
					.toHaveTextContent('success')
			},
			{ timeout: 3000 },
		)

		// hasPendingOfferがtrueであることを確認
		await expect
			.element(page.getByTestId('hasPendingOffer'))
			.toHaveTextContent('true')

		// pendingOfferのIDが正しいことを確認
		await expect
			.element(page.getByTestId('pendingOfferId'))
			.toHaveTextContent('matching-123')

		// 正しいURLでAPIが呼ばれたことを確認
		expect(mockFetch).toHaveBeenCalledWith(
			'/api/solo-matchings/guest/pending/cast-123',
			expect.objectContaining({
				method: 'GET',
			}),
		)
	})

	it('pendingオファーがない場合はnullを取得できる', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				hasPendingOffer: false,
				pendingOffer: null,
			}),
		} as Response)

		render(
			<TestWrapper>
				<TestComponent castId="cast-456" />
			</TestWrapper>,
		)

		// データ取得完了を待つ
		await vi.waitFor(
			async () => {
				await expect
					.element(page.getByTestId('status'))
					.toHaveTextContent('success')
			},
			{ timeout: 3000 },
		)

		// hasPendingOfferがfalseであることを確認
		await expect
			.element(page.getByTestId('hasPendingOffer'))
			.toHaveTextContent('false')

		// pendingOfferがnullであることを確認
		await expect
			.element(page.getByTestId('pendingOfferId'))
			.toHaveTextContent('null')
	})

	it('APIエラー時にエラーメッセージを取得できる', async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			json: async () => ({
				error: '認証が必要です',
			}),
		} as Response)

		render(
			<TestWrapper>
				<TestComponent castId="cast-error" />
			</TestWrapper>,
		)

		// エラー状態を待つ
		await vi.waitFor(
			async () => {
				await expect
					.element(page.getByTestId('status'))
					.toHaveTextContent('error')
			},
			{ timeout: 3000 },
		)

		// エラーメッセージが正しいことを確認
		await expect
			.element(page.getByTestId('error'))
			.toHaveTextContent('認証が必要です')
	})

	it('異なるcastIdでは異なるAPIエンドポイントを呼ぶ', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				hasPendingOffer: false,
				pendingOffer: null,
			}),
		} as Response)

		render(
			<TestWrapper>
				<TestComponent castId="different-cast-id" />
			</TestWrapper>,
		)

		// データ取得完了を待つ
		await vi.waitFor(
			async () => {
				await expect
					.element(page.getByTestId('status'))
					.toHaveTextContent('success')
			},
			{ timeout: 3000 },
		)

		// 正しいURLでAPIが呼ばれたことを確認
		expect(mockFetch).toHaveBeenCalledWith(
			'/api/solo-matchings/guest/pending/different-cast-id',
			expect.objectContaining({
				method: 'GET',
			}),
		)
	})
})
