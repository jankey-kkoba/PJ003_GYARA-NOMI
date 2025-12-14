/**
 * MatchingStatusCard 確認ダイアログ Integration テスト
 *
 * キャスト向けマッチング状況カードの確認ダイアログ機能をテスト
 * ボタンクリック時にダイアログが表示され、操作が正しく行われることを検証
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MatchingStatusCard } from '@/features/solo-matching/components/molecules/MatchingStatusCard'
import type { CastSoloMatching } from '@/features/solo-matching/types/soloMatching'

// グローバルfetchのモック
const mockFetch = vi.fn()
globalThis.fetch = mockFetch as unknown as typeof fetch

/**
 * テスト用のCastSoloMatchingデータ（pending状態）
 */
const mockPendingMatching: CastSoloMatching = {
	id: 'matching-1',
	guestId: 'guest-1',
	castId: 'cast-1',
	chatRoomId: null,
	status: 'pending',
	proposedDate: '2025-12-01T19:00:00.000Z',
	proposedDuration: 120,
	proposedLocation: '渋谷駅周辺',
	totalPoints: 10000,
	startedAt: null,
	scheduledEndAt: null,
	actualEndAt: null,
	extensionMinutes: 0,
	extensionPoints: 0,
	castRespondedAt: null,
	createdAt: '2025-11-24T10:00:00.000Z',
	updatedAt: '2025-11-24T10:00:00.000Z',
	guest: {
		id: 'guest-1',
		nickname: 'テストゲスト',
	},
}

/**
 * テスト用のCastSoloMatchingデータ（accepted状態）
 */
const mockAcceptedMatching: CastSoloMatching = {
	...mockPendingMatching,
	status: 'accepted',
	castRespondedAt: '2025-11-24T11:00:00.000Z',
}

/**
 * テスト用のCastSoloMatchingデータ（in_progress状態）
 */
const mockInProgressMatching: CastSoloMatching = {
	...mockPendingMatching,
	status: 'in_progress',
	startedAt: new Date().toISOString(),
	scheduledEndAt: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
}

let queryClient: QueryClient

/**
 * テストコンポーネントをラップ
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}

describe('MatchingStatusCard 確認ダイアログ', () => {
	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
					gcTime: 0,
				},
			},
		})
		vi.clearAllMocks()
	})

	describe('承認/拒否ダイアログ', () => {
		it('承認ボタンをクリックすると確認ダイアログが表示される', async () => {
			render(
				<MatchingStatusCard matching={mockPendingMatching} showActions />,
				{ wrapper: TestWrapper },
			)

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// 承認ボタンをクリック
			const acceptButton = page.getByRole('button', { name: '承認' })
			await userEvent.click(acceptButton)

			// ダイアログが表示されることを確認
			await expect
				.element(page.getByText('オファーを承認しますか？'))
				.toBeInTheDocument()

			// ゲスト情報が表示されることを確認（ダイアログ内のゲスト情報セクション）
			await expect.element(page.getByText('ゲスト情報')).toBeInTheDocument()

			// 承認するボタンが表示されることを確認
			await expect
				.element(page.getByRole('button', { name: '承認する' }))
				.toBeInTheDocument()
		})

		it('拒否ボタンをクリックすると確認ダイアログが表示される', async () => {
			render(
				<MatchingStatusCard matching={mockPendingMatching} showActions />,
				{ wrapper: TestWrapper },
			)

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// 拒否ボタンをクリック
			const rejectButton = page.getByRole('button', { name: '拒否' })
			await userEvent.click(rejectButton)

			// ダイアログが表示されることを確認
			await expect
				.element(page.getByText('オファーを拒否しますか？'))
				.toBeInTheDocument()

			// 拒否するボタンが表示されることを確認
			await expect
				.element(page.getByRole('button', { name: '拒否する' }))
				.toBeInTheDocument()
		})

		it('キャンセルボタンをクリックするとダイアログが閉じる', async () => {
			render(
				<MatchingStatusCard matching={mockPendingMatching} showActions />,
				{ wrapper: TestWrapper },
			)

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// 承認ボタンをクリックしてダイアログを開く
			const acceptButton = page.getByRole('button', { name: '承認' })
			await userEvent.click(acceptButton)

			// ダイアログが表示されることを確認
			await expect
				.element(page.getByText('オファーを承認しますか？'))
				.toBeInTheDocument()

			// キャンセルボタンをクリック
			const cancelButton = page.getByRole('button', { name: 'キャンセル' })
			await userEvent.click(cancelButton)

			// ダイアログが閉じることを確認
			await expect
				.element(page.getByText('オファーを承認しますか？'))
				.not.toBeInTheDocument()
		})

		it('承認確認後、APIが呼び出される', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					matching: { ...mockPendingMatching, status: 'accepted' },
				}),
			})

			render(
				<MatchingStatusCard matching={mockPendingMatching} showActions />,
				{ wrapper: TestWrapper },
			)

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// 承認ボタンをクリック
			await userEvent.click(page.getByRole('button', { name: '承認' }))

			// 承認するボタンをクリック
			await userEvent.click(page.getByRole('button', { name: '承認する' }))

			// APIが呼び出されることを確認
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/solo-matchings/cast/matching-1'),
				expect.objectContaining({
					method: 'PATCH',
				}),
			)
		})
	})

	describe('合流ダイアログ', () => {
		it('合流ボタンをクリックすると確認ダイアログが表示される', async () => {
			render(
				<MatchingStatusCard matching={mockAcceptedMatching} showActions />,
				{ wrapper: TestWrapper },
			)

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// 合流ボタンをクリック
			const startButton = page.getByRole('button', { name: '合流' })
			await userEvent.click(startButton)

			// ダイアログが表示されることを確認
			await expect
				.element(page.getByText('ゲストと合流しましたか？'))
				.toBeInTheDocument()

			// 合流したボタンが表示されることを確認
			await expect
				.element(page.getByRole('button', { name: '合流した' }))
				.toBeInTheDocument()
		})

		it('合流確認後、APIが呼び出される', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					matching: { ...mockAcceptedMatching, status: 'in_progress' },
				}),
			})

			render(
				<MatchingStatusCard matching={mockAcceptedMatching} showActions />,
				{ wrapper: TestWrapper },
			)

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// 合流ボタンをクリック
			await userEvent.click(page.getByRole('button', { name: '合流' }))

			// 合流したボタンをクリック
			await userEvent.click(page.getByRole('button', { name: '合流した' }))

			// APIが呼び出されることを確認
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/solo-matchings/cast/matching-1/start'),
				expect.objectContaining({
					method: 'PATCH',
				}),
			)
		})
	})

	describe('終了ダイアログ', () => {
		it('終了ボタンをクリックすると確認ダイアログが表示される', async () => {
			render(
				<MatchingStatusCard matching={mockInProgressMatching} showActions />,
				{ wrapper: TestWrapper },
			)

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// 終了ボタンをクリック
			const completeButton = page.getByRole('button', { name: '終了' })
			await userEvent.click(completeButton)

			// ダイアログが表示されることを確認
			await expect
				.element(page.getByText('ギャラ飲みを終了しますか？'))
				.toBeInTheDocument()

			// 終了するボタンが表示されることを確認
			await expect
				.element(page.getByRole('button', { name: '終了する' }))
				.toBeInTheDocument()
		})

		it('終了確認後、APIが呼び出される', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					success: true,
					matching: { ...mockInProgressMatching, status: 'completed' },
				}),
			})

			render(
				<MatchingStatusCard matching={mockInProgressMatching} showActions />,
				{ wrapper: TestWrapper },
			)

			// コンパクト表示のカードをクリックしてモーダルを開く
			await page.getByRole('button').first().click()

			// 終了ボタンをクリック
			await userEvent.click(page.getByRole('button', { name: '終了' }))

			// 終了するボタンをクリック
			await userEvent.click(page.getByRole('button', { name: '終了する' }))

			// APIが呼び出されることを確認
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/solo-matchings/cast/matching-1/end'),
				expect.objectContaining({
					method: 'PATCH',
				}),
			)
		})
	})
})
