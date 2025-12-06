/**
 * MatchingOfferForm コンポーネント統合テスト
 *
 * マッチングオファー送信フォームの動作を検証
 * フォーム入力、バリデーション、送信処理、合計ポイント計算をテスト
 * 時給はキャストのランクから自動計算される
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MatchingOfferForm } from '@/features/solo-matching/components/organisms/MatchingOfferForm'

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
 * キャスト詳細のモックレスポンス（ランク1 = 3000ポイント/時間）
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
 * ランク2のキャスト詳細モック（4000ポイント/時間）
 */
const mockCastDetailRank2 = {
	id: 'cast-456',
	name: 'ランク2キャスト',
	age: 28,
	bio: 'ランク2のキャストです',
	rank: 2,
	areaName: '東京都',
}

/**
 * デフォルトのモック設定（キャスト詳細API対応）
 */
function setupDefaultMocks(castDetail = mockCastDetail) {
	mockFetch.mockImplementation((url: string) => {
		// キャスト詳細API
		if (url.includes('/api/casts/')) {
			return Promise.resolve({
				ok: true,
				json: async () => ({
					success: true,
					data: { cast: castDetail },
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

describe('MatchingOfferForm', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		})
		setupDefaultMocks()
	})

	describe('初期表示', () => {
		it('すべてのフォームフィールドが表示される', async () => {
			render(
				<TestWrapper>
					<MatchingOfferForm castId="cast-123" />
				</TestWrapper>,
			)

			// 開始時刻選択
			await expect.element(page.getByText('希望開始時刻')).toBeInTheDocument()

			// 時間選択
			await expect.element(page.getByText('希望時間')).toBeInTheDocument()

			// 場所入力
			await expect.element(page.getByText('希望場所')).toBeInTheDocument()
			await expect
				.element(page.getByPlaceholder('例：渋谷駅周辺'))
				.toBeInTheDocument()

			// ランク別時給表示（読み取り専用）
			await expect.element(page.getByText('キャストランク')).toBeInTheDocument()
			await expect.element(page.getByText('時給')).toBeInTheDocument()

			// 合計ポイント表示
			await expect.element(page.getByText('合計ポイント')).toBeInTheDocument()

			// 送信ボタン
			await expect
				.element(page.getByRole('button', { name: 'オファーを送信' }))
				.toBeInTheDocument()
		})

		it('デフォルト値が設定されている', async () => {
			render(
				<TestWrapper>
					<MatchingOfferForm castId="cast-123" />
				</TestWrapper>,
			)

			// デフォルトの合計ポイント（2時間 × 3000ポイント/時間 = 6000ポイント）
			await expect.element(page.getByText('6,000ポイント')).toBeInTheDocument()
			// ランク1のランク名「ブロンズ」が表示される
			await expect.element(page.getByText('ブロンズ')).toBeInTheDocument()
			// 時給が表示される
			await expect
				.element(page.getByText('3,000ポイント/時間'))
				.toBeInTheDocument()
		})
	})

	describe('開始時刻選択', () => {
		it('カスタム日時選択時に日時入力フィールドが表示される', async () => {
			render(
				<TestWrapper>
					<MatchingOfferForm castId="cast-123" />
				</TestWrapper>,
			)

			// 開始時刻選択のselectをクリック
			const timeSelectTrigger = page.getByRole('combobox').first()
			await timeSelectTrigger.click()

			// 「その他（カスタム日時）」を選択（optionロールで検索）
			await page.getByRole('option', { name: 'その他（カスタム日時）' }).click()

			// カスタム日時入力フィールドが表示される
			await expect
				.element(page.getByLabelText('カスタム日時'))
				.toBeInTheDocument()
		})
	})

	describe('合計ポイント計算', () => {
		it('時間を変更すると合計ポイントが再計算される', async () => {
			render(
				<TestWrapper>
					<MatchingOfferForm castId="cast-123" />
				</TestWrapper>,
			)

			// 初期値: 2時間 × 3000ポイント = 6000ポイント
			await expect.element(page.getByText('6,000ポイント')).toBeInTheDocument()

			// 時間を3時間に変更
			const durationSelect = page.getByRole('combobox').nth(1)
			await durationSelect.click()
			await page.getByRole('option', { name: '3時間', exact: true }).click()

			// 3時間 × 3000ポイント = 9000ポイント
			await expect.element(page.getByText('9,000ポイント')).toBeInTheDocument()
		})

		it('ランクによって時給が異なる', async () => {
			// ランク2のキャストを設定
			setupDefaultMocks(mockCastDetailRank2)

			render(
				<TestWrapper>
					<MatchingOfferForm castId="cast-456" />
				</TestWrapper>,
			)

			// ランク2の時給4000ポイント × 2時間 = 8000ポイント
			await expect.element(page.getByText('8,000ポイント')).toBeInTheDocument()
			// ランク2のランク名「シルバー」が表示される
			await expect.element(page.getByText('シルバー')).toBeInTheDocument()
			// 時給が表示される
			await expect
				.element(page.getByText('4,000ポイント/時間'))
				.toBeInTheDocument()
		})
	})

	describe('フォーム送信', () => {
		it('有効な入力でフォームを送信できる', async () => {
			const mockSoloMatching = {
				id: 'matching-123',
				guestId: 'guest-123',
				castId: 'cast-123',
				chatRoomId: null,
				status: 'pending' as const,
				proposedDate: new Date(Date.now() + 3600000), // 1時間後
				proposedDuration: 120,
				proposedLocation: '渋谷駅周辺',
				totalPoints: 6000,
				startedAt: null,
				scheduledEndAt: null,
				actualEndAt: null,
				extensionMinutes: 0,
				extensionPoints: 0,
				castRespondedAt: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
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
				// POSTリクエスト
				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						soloMatching: mockSoloMatching,
					}),
				} as Response)
			})

			const onSuccess = vi.fn()

			render(
				<TestWrapper>
					<MatchingOfferForm castId="cast-123" onSuccess={onSuccess} />
				</TestWrapper>,
			)

			// デフォルトでは「1時間後」が選択されているので、proposedDateは自動設定される
			// 場所を入力（これが唯一の必須入力フィールド）
			const locationInput = page.getByPlaceholder('例：渋谷駅周辺')
			await locationInput.fill('渋谷駅周辺')

			// 送信ボタンをクリック
			const submitButton = page.getByRole('button', { name: 'オファーを送信' })
			await submitButton.click()

			// API呼び出しとonSuccessコールバックが呼ばれるのを待つ
			await vi.waitFor(
				() => {
					expect(mockFetch).toHaveBeenCalled()
					expect(onSuccess).toHaveBeenCalled()
				},
				{ timeout: 3000 },
			)
		})

		it('送信中はボタンがdisabledになり、テキストが変わる', async () => {
			let resolvePromise: (value: Response) => void = () => {}
			const pendingPromise = new Promise<Response>((resolve) => {
				resolvePromise = resolve
			})

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
				return pendingPromise
			})

			render(
				<TestWrapper>
					<MatchingOfferForm castId="cast-123" />
				</TestWrapper>,
			)

			// 場所を入力
			const locationInput = page.getByPlaceholder('例：渋谷駅周辺')
			await locationInput.fill('新宿')

			// 送信ボタンをクリック
			const submitButton = page.getByRole('button', { name: 'オファーを送信' })
			await submitButton.click()

			// 送信中の表示を待つ
			await vi.waitFor(async () => {
				await expect
					.element(page.getByRole('button', { name: '送信中...' }))
					.toBeInTheDocument()
			})

			await expect
				.element(page.getByRole('button', { name: '送信中...' }))
				.toBeDisabled()

			// 後処理: Promiseを解決
			resolvePromise({
				ok: true,
				json: async () => ({
					success: true,
					soloMatching: {
						id: 'matching-123',
						guestId: 'guest-123',
						castId: 'cast-123',
						status: 'pending',
						proposedDate: new Date(Date.now() + 3600000),
						proposedDuration: 120,
						proposedLocation: '新宿',
						totalPoints: 6000,
					},
				}),
			} as Response)
		})

		it('エラー時にエラートーストが表示される', async () => {
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
				// エラーレスポンス
				return Promise.resolve({
					ok: false,
					json: async () => ({
						error: 'エラーが発生しました',
					}),
				} as Response)
			})

			render(
				<TestWrapper>
					<MatchingOfferForm castId="cast-123" />
				</TestWrapper>,
			)

			// 場所を入力
			const locationInput = page.getByPlaceholder('例：渋谷駅周辺')
			await locationInput.fill('渋谷')

			// 送信ボタンをクリック
			const submitButton = page.getByRole('button', { name: 'オファーを送信' })
			await submitButton.click()

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
		})
	})

	describe('フォームリセット', () => {
		it('送信成功後にフォームがリセットされる', async () => {
			const mockSoloMatching = {
				id: 'matching-123',
				guestId: 'guest-123',
				castId: 'cast-123',
				chatRoomId: null,
				status: 'pending' as const,
				proposedDate: new Date(Date.now() + 3600000),
				proposedDuration: 90,
				proposedLocation: '池袋',
				totalPoints: 4500,
				startedAt: null,
				scheduledEndAt: null,
				actualEndAt: null,
				extensionMinutes: 0,
				extensionPoints: 0,
				castRespondedAt: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
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
				// POSTリクエスト
				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						soloMatching: mockSoloMatching,
					}),
				} as Response)
			})

			const onSuccess = vi.fn()

			render(
				<TestWrapper>
					<MatchingOfferForm castId="cast-123" onSuccess={onSuccess} />
				</TestWrapper>,
			)

			// 場所を入力
			const locationInput = page.getByPlaceholder('例：渋谷駅周辺')
			await locationInput.fill('池袋')

			// 時間を1時間30分に変更
			const durationSelect = page.getByRole('combobox').nth(1)
			await durationSelect.click()
			await page.getByRole('option', { name: '1時間30分' }).click()

			// 1.5時間 × 3000 = 4500ポイント
			await expect.element(page.getByText('4,500ポイント')).toBeInTheDocument()

			// 送信
			const submitButton = page.getByRole('button', { name: 'オファーを送信' })
			await submitButton.click()

			// 成功を待つ
			await vi.waitFor(
				() => {
					expect(onSuccess).toHaveBeenCalled()
				},
				{ timeout: 3000 },
			)

			// フォームがデフォルト値にリセットされる
			// 合計ポイントがデフォルトの6000ポイントに戻る
			await expect.element(page.getByText('6,000ポイント')).toBeInTheDocument()
		})
	})

	describe('キャスト情報取得', () => {
		it('キャスト情報取得中はローディング表示', async () => {
			let resolvePromise: (value: Response) => void = () => {}
			const pendingPromise = new Promise<Response>((resolve) => {
				resolvePromise = resolve
			})

			mockFetch.mockReturnValue(pendingPromise)

			render(
				<TestWrapper>
					<MatchingOfferForm castId="cast-123" />
				</TestWrapper>,
			)

			// ローディング表示
			await expect.element(page.getByText('読み込み中...')).toBeInTheDocument()

			// 後処理
			resolvePromise({
				ok: true,
				json: async () => ({
					success: true,
					data: { cast: mockCastDetail },
				}),
			} as Response)
		})

		it('キャスト情報取得失敗時はエラー表示', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				json: async () => ({
					error: 'キャストが見つかりません',
				}),
			} as Response)

			render(
				<TestWrapper>
					<MatchingOfferForm castId="invalid-cast" />
				</TestWrapper>,
			)

			// エラー表示
			await expect
				.element(page.getByText('キャスト情報の取得に失敗しました'))
				.toBeInTheDocument()
		})
	})
})
