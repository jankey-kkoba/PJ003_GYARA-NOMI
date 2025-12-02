/**
 * MatchingOfferDialog コンポーネント統合テスト
 *
 * マッチングオファー送信ダイアログの動作を検証
 * ダイアログの開閉、フォーム統合、成功時の処理をテスト
 * pendingオファーがある場合の「回答待ちです」表示をテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MatchingOfferDialog } from '@/features/solo-matching/components/organisms/MatchingOfferDialog'

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

function TestWrapper({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}

/**
 * キャスト詳細のモックレスポンス
 */
const mockCastDetail = {
	id: 'cast-123',
	name: 'テストキャスト',
	age: 25,
	bio: 'テスト用のキャストです',
	rank: 1,
	areaName: '東京都',
}

/**
 * pendingオファーがない場合のレスポンスを返すモックを設定
 */
function setupNoPendingOfferMock() {
	mockFetch.mockImplementation((url: string) => {
		// キャスト詳細API
		if (url.includes('/api/casts/')) {
			return Promise.resolve({
				ok: true,
				json: async () => ({
					success: true,
					data: { cast: mockCastDetail },
				}),
			} as Response)
		}
		if (url.includes('/api/solo-matchings/guest/pending/')) {
			return Promise.resolve({
				ok: true,
				json: async () => ({
					success: true,
					hasPendingOffer: false,
					pendingOffer: null,
				}),
			} as Response)
		}
		// その他のリクエストはデフォルトのレスポンス
		return Promise.resolve({
			ok: true,
			json: async () => ({ success: true }),
		} as Response)
	})
}

describe('MatchingOfferDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})
		// デフォルトではpendingオファーがない状態をモック
		setupNoPendingOfferMock()
	})

	describe('初期表示', () => {
		it('トリガーボタンが表示される', async () => {
			render(
				<TestWrapper>
					<MatchingOfferDialog castId="cast-123" />
				</TestWrapper>,
			)

			await expect
				.element(page.getByRole('button', { name: 'マッチングオファーを送る' }))
				.toBeInTheDocument()
		})

		it('初期状態ではダイアログが閉じている', async () => {
			render(
				<TestWrapper>
					<MatchingOfferDialog castId="cast-123" />
				</TestWrapper>,
			)

			// ダイアログのタイトルが表示されていない
			await expect
				.element(page.getByText('キャストへのマッチングオファー'))
				.not.toBeInTheDocument()
		})
	})

	describe('ダイアログの開閉', () => {
		it('トリガーボタンをクリックするとダイアログが開く', async () => {
			render(
				<TestWrapper>
					<MatchingOfferDialog castId="cast-123" castName="山田花子" />
				</TestWrapper>,
			)

			// トリガーボタンをクリック
			const triggerButton = page.getByRole('button', {
				name: 'マッチングオファーを送る',
			})
			await triggerButton.click()

			// ダイアログが開く
			await expect
				.element(page.getByText('山田花子へのマッチングオファー'))
				.toBeInTheDocument()
			await expect
				.element(
					page.getByText(
						'希望日時、時間、場所を入力してオファーを送信してください。',
					),
				)
				.toBeInTheDocument()
		})

		it('castNameが指定されていない場合はデフォルトで「キャスト」と表示される', async () => {
			render(
				<TestWrapper>
					<MatchingOfferDialog castId="cast-123" />
				</TestWrapper>,
			)

			// トリガーボタンをクリック
			const triggerButton = page.getByRole('button', {
				name: 'マッチングオファーを送る',
			})
			await triggerButton.click()

			// デフォルトのキャスト名
			await expect
				.element(page.getByText('キャストへのマッチングオファー'))
				.toBeInTheDocument()
		})
	})

	describe('フォーム統合', () => {
		it('ダイアログ内にMatchingOfferFormが表示される', async () => {
			render(
				<TestWrapper>
					<MatchingOfferDialog castId="cast-123" castName="佐藤美咲" />
				</TestWrapper>,
			)

			// ダイアログを開く
			const triggerButton = page.getByRole('button', {
				name: 'マッチングオファーを送る',
			})
			await triggerButton.click()

			// フォームのフィールドが表示される
			await expect.element(page.getByText('希望開始時刻')).toBeInTheDocument()
			await expect.element(page.getByText('希望時間')).toBeInTheDocument()
			await expect.element(page.getByText('希望場所')).toBeInTheDocument()
			// 時給はランクから自動計算されるため、読み取り専用で表示される
			await expect.element(page.getByText('キャストランク')).toBeInTheDocument()
			await expect.element(page.getByText('時給')).toBeInTheDocument()
			await expect
				.element(page.getByRole('button', { name: 'オファーを送信' }))
				.toBeInTheDocument()
		})

		it('フォームからマッチングオファーを送信できる', async () => {
			const mockSoloMatching = {
				id: 'matching-123',
				guestId: 'guest-123',
				castId: 'cast-123',
				chatRoomId: null,
				status: 'pending' as const,
				proposedDate: new Date(Date.now() + 3600000),
				proposedDuration: 120,
				proposedLocation: '原宿',
				totalPoints: 6000,
				startedAt: null,
				scheduledEndAt: null,
				actualEndAt: null,
				extensionMinutes: 0,
				extensionPoints: 0,
				castRespondedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			mockFetch.mockImplementation((url: string) => {
				// キャスト詳細API
				if (url.includes('/api/casts/')) {
					return Promise.resolve({
						ok: true,
						json: async () => ({
							success: true,
							data: { cast: mockCastDetail },
						}),
					} as Response)
				}
				if (url.includes('/api/solo-matchings/guest/pending/')) {
					return Promise.resolve({
						ok: true,
						json: async () => ({
							success: true,
							hasPendingOffer: false,
							pendingOffer: null,
						}),
					} as Response)
				}
				// POSTリクエスト
				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						soloMatching: mockSoloMatching,
					}),
				} as Response)
			})

			render(
				<TestWrapper>
					<MatchingOfferDialog castId="cast-123" castName="高橋愛" />
				</TestWrapper>,
			)

			// ダイアログを開く
			const triggerButton = page.getByRole('button', {
				name: 'マッチングオファーを送る',
			})
			await triggerButton.click()

			// ダイアログが開いていることを確認
			await expect
				.element(page.getByText('高橋愛へのマッチングオファー'))
				.toBeInTheDocument()

			// 場所を入力
			const locationInput = page.getByPlaceholder('例：渋谷駅周辺')
			await locationInput.fill('原宿')

			// 時給はランクから自動計算されるため入力不要

			// 送信
			const submitButton = page.getByRole('button', { name: 'オファーを送信' })
			await submitButton.click()

			// API呼び出しを確認
			await vi.waitFor(
				() => {
					expect(mockFetch).toHaveBeenCalledWith(
						'/api/solo-matchings/guest',
						expect.objectContaining({
							method: 'POST',
						}),
					)
				},
				{ timeout: 3000 },
			)
		})
	})

	describe('成功時の処理', () => {
		it('送信成功時にトーストが表示される', async () => {
			const mockSoloMatching = {
				id: 'matching-456',
				guestId: 'guest-456',
				castId: 'cast-456',
				chatRoomId: null,
				status: 'pending' as const,
				proposedDate: new Date(Date.now() + 3600000),
				proposedDuration: 150,
				proposedLocation: '銀座',
				totalPoints: 7500,
				startedAt: null,
				scheduledEndAt: null,
				actualEndAt: null,
				extensionMinutes: 0,
				extensionPoints: 0,
				castRespondedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			mockFetch.mockImplementation((url: string) => {
				// キャスト詳細API
				if (url.includes('/api/casts/')) {
					return Promise.resolve({
						ok: true,
						json: async () => ({
							success: true,
							data: { cast: mockCastDetail },
						}),
					} as Response)
				}
				if (url.includes('/api/solo-matchings/guest/pending/')) {
					return Promise.resolve({
						ok: true,
						json: async () => ({
							success: true,
							hasPendingOffer: false,
							pendingOffer: null,
						}),
					} as Response)
				}
				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						soloMatching: mockSoloMatching,
					}),
				} as Response)
			})

			render(
				<TestWrapper>
					<MatchingOfferDialog castId="cast-456" />
				</TestWrapper>,
			)

			// ダイアログを開く
			await page
				.getByRole('button', { name: 'マッチングオファーを送る' })
				.click()

			// 場所を入力
			await page.getByPlaceholder('例：渋谷駅周辺').fill('銀座')

			// 送信
			await page.getByRole('button', { name: 'オファーを送信' }).click()

			// 成功トーストが表示される
			await vi.waitFor(
				() => {
					expect(mockShowToast).toHaveBeenCalledWith(
						'マッチングオファーを送信しました',
						'success',
					)
				},
				{ timeout: 3000 },
			)
		})

		it('送信成功時にダイアログが閉じる', async () => {
			const mockSoloMatching = {
				id: 'matching-789',
				guestId: 'guest-789',
				castId: 'cast-789',
				chatRoomId: null,
				status: 'pending' as const,
				proposedDate: new Date(Date.now() + 7200000),
				proposedDuration: 180,
				proposedLocation: '六本木',
				totalPoints: 9000,
				startedAt: null,
				scheduledEndAt: null,
				actualEndAt: null,
				extensionMinutes: 0,
				extensionPoints: 0,
				castRespondedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			mockFetch.mockImplementation((url: string) => {
				// キャスト詳細API
				if (url.includes('/api/casts/')) {
					return Promise.resolve({
						ok: true,
						json: async () => ({
							success: true,
							data: { cast: mockCastDetail },
						}),
					} as Response)
				}
				if (url.includes('/api/solo-matchings/guest/pending/')) {
					return Promise.resolve({
						ok: true,
						json: async () => ({
							success: true,
							hasPendingOffer: false,
							pendingOffer: null,
						}),
					} as Response)
				}
				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						soloMatching: mockSoloMatching,
					}),
				} as Response)
			})

			render(
				<TestWrapper>
					<MatchingOfferDialog castId="cast-789" castName="伊藤舞" />
				</TestWrapper>,
			)

			// ダイアログを開く
			await page
				.getByRole('button', { name: 'マッチングオファーを送る' })
				.click()

			// ダイアログが開いていることを確認
			await expect
				.element(page.getByText('伊藤舞へのマッチングオファー'))
				.toBeInTheDocument()

			// 場所を入力
			await page.getByPlaceholder('例：渋谷駅周辺').fill('六本木')

			// 送信
			await page.getByRole('button', { name: 'オファーを送信' }).click()

			// ダイアログが閉じる（タイトルが表示されなくなる）
			await vi.waitFor(
				async () => {
					await expect
						.element(page.getByText('伊藤舞へのマッチングオファー'))
						.not.toBeInTheDocument()
				},
				{ timeout: 3000 },
			)
		})
	})

	describe('エラーハンドリング', () => {
		it('送信失敗時にエラートーストが表示され、ダイアログは開いたまま', async () => {
			mockFetch.mockImplementation((url: string) => {
				// キャスト詳細API
				if (url.includes('/api/casts/')) {
					return Promise.resolve({
						ok: true,
						json: async () => ({
							success: true,
							data: { cast: mockCastDetail },
						}),
					} as Response)
				}
				if (url.includes('/api/solo-matchings/guest/pending/')) {
					return Promise.resolve({
						ok: true,
						json: async () => ({
							success: true,
							hasPendingOffer: false,
							pendingOffer: null,
						}),
					} as Response)
				}
				return Promise.resolve({
					ok: false,
					json: async () => ({
						error: 'エラーが発生しました',
					}),
				} as Response)
			})

			render(
				<TestWrapper>
					<MatchingOfferDialog castId="cast-999" castName="鈴木さくら" />
				</TestWrapper>,
			)

			// ダイアログを開く
			await page
				.getByRole('button', { name: 'マッチングオファーを送る' })
				.click()

			// 場所を入力
			await page.getByPlaceholder('例：渋谷駅周辺').fill('新宿')

			// 送信
			await page.getByRole('button', { name: 'オファーを送信' }).click()

			// エラートーストが表示される
			await vi.waitFor(
				() => {
					expect(mockShowToast).toHaveBeenCalledWith(
						'エラーが発生しました',
						'error',
					)
				},
				{ timeout: 3000 },
			)

			// ダイアログは開いたまま
			await expect
				.element(page.getByText('鈴木さくらへのマッチングオファー'))
				.toBeInTheDocument()
		})
	})

	describe('重複オファー防止', () => {
		it('pendingオファーがある場合は「回答待ちです」が表示される', async () => {
			mockFetch.mockImplementation((url: string) => {
				if (url.includes('/api/solo-matchings/guest/pending/')) {
					return Promise.resolve({
						ok: true,
						json: async () => ({
							success: true,
							hasPendingOffer: true,
							pendingOffer: {
								id: 'pending-matching-123',
								guestId: 'guest-123',
								castId: 'cast-pending',
								status: 'pending',
							},
						}),
					} as Response)
				}
				return Promise.resolve({
					ok: true,
					json: async () => ({ success: true }),
				} as Response)
			})

			render(
				<TestWrapper>
					<MatchingOfferDialog castId="cast-pending" castName="田中美香" />
				</TestWrapper>,
			)

			// 「回答待ちです」ボタンが表示される
			await expect
				.element(page.getByRole('button', { name: '回答待ちです' }))
				.toBeInTheDocument()

			// ボタンが無効化されている
			const button = page.getByRole('button', { name: '回答待ちです' })
			await expect.element(button).toBeDisabled()

			// 「マッチングオファーを送る」ボタンは表示されない
			await expect
				.element(page.getByRole('button', { name: 'マッチングオファーを送る' }))
				.not.toBeInTheDocument()
		})

		it('pendingオファーがない場合は通常のオファーボタンが表示される', async () => {
			// beforeEachでsetupNoPendingOfferMockが設定されている

			render(
				<TestWrapper>
					<MatchingOfferDialog castId="cast-no-pending" castName="佐々木愛" />
				</TestWrapper>,
			)

			// 「マッチングオファーを送る」ボタンが表示される
			await expect
				.element(page.getByRole('button', { name: 'マッチングオファーを送る' }))
				.toBeInTheDocument()

			// 「回答待ちです」ボタンは表示されない
			await expect
				.element(page.getByRole('button', { name: '回答待ちです' }))
				.not.toBeInTheDocument()
		})
	})
})
