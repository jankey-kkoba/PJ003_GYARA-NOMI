/**
 * GroupMatchingOfferForm コンポーネント統合テスト
 *
 * グループマッチングオファー送信フォームの動作を検証
 * フォーム入力、バリデーション、送信処理、合計ポイント計算をテスト
 * 料金はブロンズランク基準で計算される
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GroupMatchingOfferForm } from '@/features/group-matching/components/organisms/GroupMatchingOfferForm'

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
 * デフォルトのモック設定（API成功レスポンス）
 */
function setupDefaultMocks() {
	mockFetch.mockImplementation(() => {
		return Promise.resolve({
			ok: true,
			json: async () => ({
				success: true,
				groupMatching: {
					id: 'matching-123',
					guestId: 'guest-123',
					requestedCastCount: 2,
					status: 'pending',
					proposedDate: new Date(Date.now() + 3600000),
					proposedDuration: 120,
					proposedLocation: '渋谷駅周辺',
					totalPoints: 12000,
				},
				participantCount: 5,
			}),
		} as Response)
	})
}

describe('GroupMatchingOfferForm', () => {
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
					<GroupMatchingOfferForm />
				</TestWrapper>,
			)

			// 希望人数選択
			await expect.element(page.getByText('希望人数')).toBeInTheDocument()

			// 年齢フィルター
			await expect.element(page.getByText('年齢（任意）')).toBeInTheDocument()
			await expect
				.element(page.getByText('オファーを送るキャストの年齢を絞り込めます'))
				.toBeInTheDocument()

			// 開始時刻選択
			await expect.element(page.getByText('希望開始時刻')).toBeInTheDocument()

			// 時間選択
			await expect.element(page.getByText('希望時間')).toBeInTheDocument()

			// 場所入力
			await expect.element(page.getByText('希望場所')).toBeInTheDocument()
			await expect
				.element(page.getByPlaceholder('例：渋谷駅周辺'))
				.toBeInTheDocument()

			// 基準時給表示
			await expect.element(page.getByText('基準時給')).toBeInTheDocument()
			await expect
				.element(page.getByText('3,000ポイント/時間/人'))
				.toBeInTheDocument()

			// 合計ポイント表示
			await expect
				.element(page.getByText('合計ポイント（目安）'))
				.toBeInTheDocument()

			// 送信ボタン
			await expect
				.element(page.getByRole('button', { name: 'オファーを送信' }))
				.toBeInTheDocument()
		})

		it('デフォルト値が設定されている', async () => {
			render(
				<TestWrapper>
					<GroupMatchingOfferForm />
				</TestWrapper>,
			)

			// デフォルト: 2人 × 2時間 × 3000ポイント/時間 = 12,000ポイント
			await expect.element(page.getByText('12,000ポイント')).toBeInTheDocument()
		})
	})

	describe('人数選択', () => {
		it('人数を変更すると合計ポイントが再計算される', async () => {
			render(
				<TestWrapper>
					<GroupMatchingOfferForm />
				</TestWrapper>,
			)

			// 初期値: 2人 × 2時間 × 3000 = 12,000ポイント
			await expect.element(page.getByText('12,000ポイント')).toBeInTheDocument()

			// 人数を5人に変更（最初のcombobox）
			const castCountSelect = page.getByRole('combobox').first()
			await castCountSelect.click()
			await page.getByRole('option', { name: '5人' }).click()

			// 5人 × 2時間 × 3000ポイント = 30,000ポイント
			await expect.element(page.getByText('30,000ポイント')).toBeInTheDocument()
		})
	})

	describe('開始時刻選択', () => {
		it('カスタム日時選択時に日時入力フィールドが表示される', async () => {
			render(
				<TestWrapper>
					<GroupMatchingOfferForm />
				</TestWrapper>,
			)

			// 開始時刻選択のselectをクリック（2番目のcombobox）
			const timeSelectTrigger = page.getByRole('combobox').nth(1)
			await timeSelectTrigger.click()

			// 「その他（カスタム日時）」を選択
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
					<GroupMatchingOfferForm />
				</TestWrapper>,
			)

			// 初期値: 2人 × 2時間 × 3000 = 12,000ポイント
			await expect.element(page.getByText('12,000ポイント')).toBeInTheDocument()

			// 時間を3時間に変更（3番目のcombobox）
			const durationSelect = page.getByRole('combobox').nth(2)
			await durationSelect.click()
			await page.getByRole('option', { name: '3時間', exact: true }).click()

			// 2人 × 3時間 × 3000ポイント = 18,000ポイント
			await expect.element(page.getByText('18,000ポイント')).toBeInTheDocument()
		})

		it('人数と時間の両方を変更した場合の計算', async () => {
			render(
				<TestWrapper>
					<GroupMatchingOfferForm />
				</TestWrapper>,
			)

			// 人数を3人に変更
			const castCountSelect = page.getByRole('combobox').first()
			await castCountSelect.click()
			await page.getByRole('option', { name: '3人' }).click()

			// 時間を1時間30分に変更
			const durationSelect = page.getByRole('combobox').nth(2)
			await durationSelect.click()
			await page.getByRole('option', { name: '1時間30分' }).click()

			// 3人 × 1.5時間 × 3000ポイント = 13,500ポイント
			await expect.element(page.getByText('13,500ポイント')).toBeInTheDocument()
		})
	})

	describe('フォーム送信', () => {
		it('有効な入力でフォームを送信できる', async () => {
			const mockGroupMatching = {
				id: 'matching-123',
				guestId: 'guest-123',
				requestedCastCount: 2,
				status: 'pending' as const,
				proposedDate: new Date(Date.now() + 3600000), // 1時間後
				proposedDuration: 120,
				proposedLocation: '渋谷駅周辺',
				totalPoints: 12000,
			}

			mockFetch.mockImplementation(() => {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						groupMatching: mockGroupMatching,
						participantCount: 5,
					}),
				} as Response)
			})

			const onSuccess = vi.fn()

			render(
				<TestWrapper>
					<GroupMatchingOfferForm onSuccess={onSuccess} />
				</TestWrapper>,
			)

			// 場所を入力
			const locationInput = page.getByPlaceholder('例：渋谷駅周辺')
			await locationInput.fill('渋谷駅周辺')

			// 送信ボタンをクリック
			const submitButton = page.getByRole('button', { name: 'オファーを送信' })
			await submitButton.click()

			// API呼び出しとonSuccessコールバックが呼ばれるのを待つ
			await vi.waitFor(
				() => {
					expect(mockFetch).toHaveBeenCalled()
					expect(onSuccess).toHaveBeenCalledWith(5)
				},
				{ timeout: 3000 },
			)
		})

		it('送信中はボタンがdisabledになり、テキストが変わる', async () => {
			let resolvePromise: (value: Response) => void = () => {}
			const pendingPromise = new Promise<Response>((resolve) => {
				resolvePromise = resolve
			})

			mockFetch.mockReturnValue(pendingPromise)

			render(
				<TestWrapper>
					<GroupMatchingOfferForm />
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
					groupMatching: {
						id: 'matching-123',
						guestId: 'guest-123',
						requestedCastCount: 2,
						status: 'pending',
						proposedDate: new Date(Date.now() + 3600000),
						proposedDuration: 120,
						proposedLocation: '新宿',
						totalPoints: 12000,
					},
					participantCount: 3,
				}),
			} as Response)
		})

		it('エラー時にエラートーストが表示される', async () => {
			mockFetch.mockImplementation(() => {
				return Promise.resolve({
					ok: false,
					json: async () => ({
						error: 'エラーが発生しました',
					}),
				} as Response)
			})

			render(
				<TestWrapper>
					<GroupMatchingOfferForm />
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

	describe('年齢フィルタ', () => {
		it('年齢入力フィールドが表示される', async () => {
			render(
				<TestWrapper>
					<GroupMatchingOfferForm />
				</TestWrapper>,
			)

			// 年齢フィルタのラベルと入力フィールドが表示される
			await expect.element(page.getByText('年齢（任意）')).toBeInTheDocument()

			// 最小年齢と最大年齢の入力フィールドがある
			const ageInputs = page.getByRole('spinbutton')
			// 2つの年齢入力フィールド
			await expect.element(ageInputs.first()).toBeInTheDocument()
			await expect.element(ageInputs.nth(1)).toBeInTheDocument()

			// 「〜」と「歳」の区切りテキスト
			await expect.element(page.getByText('〜')).toBeInTheDocument()
			await expect.element(page.getByText('歳')).toBeInTheDocument()
		})

		it('年齢フィルタに値を入力できる', async () => {
			render(
				<TestWrapper>
					<GroupMatchingOfferForm />
				</TestWrapper>,
			)

			// 年齢入力フィールドを取得（spinbuttonはnumber input）
			const ageInputs = page.getByRole('spinbutton')
			const minAgeInput = ageInputs.first()
			const maxAgeInput = ageInputs.nth(1)

			// 最小年齢を入力
			await minAgeInput.fill('25')
			await expect.element(minAgeInput).toHaveValue(25) // number inputは数値を返す

			// 最大年齢を入力
			await maxAgeInput.fill('30')
			await expect.element(maxAgeInput).toHaveValue(30) // number inputは数値を返す
		})

		it('年齢フィルタを指定してフォームを送信できる', async () => {
			const onSuccess = vi.fn()

			mockFetch.mockImplementation((_, options) => {
				// リクエストボディを検証
				const body = JSON.parse(options?.body as string)
				expect(body.minAge).toBe(25)
				expect(body.maxAge).toBe(30)

				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						groupMatching: {
							id: 'matching-123',
							guestId: 'guest-123',
							requestedCastCount: 2,
							status: 'pending',
							proposedDate: new Date(Date.now() + 3600000),
							proposedDuration: 120,
							proposedLocation: '渋谷駅周辺',
							totalPoints: 12000,
						},
						participantCount: 3,
					}),
				} as Response)
			})

			render(
				<TestWrapper>
					<GroupMatchingOfferForm onSuccess={onSuccess} />
				</TestWrapper>,
			)

			// 年齢フィルタを入力
			const ageInputs = page.getByRole('spinbutton')
			await ageInputs.first().fill('25')
			await ageInputs.nth(1).fill('30')

			// 場所を入力
			const locationInput = page.getByPlaceholder('例：渋谷駅周辺')
			await locationInput.fill('渋谷駅周辺')

			// 送信ボタンをクリック
			const submitButton = page.getByRole('button', { name: 'オファーを送信' })
			await submitButton.click()

			// API呼び出しとonSuccessコールバックが呼ばれるのを待つ
			await vi.waitFor(
				() => {
					expect(mockFetch).toHaveBeenCalled()
					expect(onSuccess).toHaveBeenCalledWith(3)
				},
				{ timeout: 3000 },
			)
		})

		it('年齢フィルタを未指定でもフォームを送信できる', async () => {
			const onSuccess = vi.fn()

			mockFetch.mockImplementation((_, options) => {
				// リクエストボディを検証（年齢フィルタが含まれていないことを確認）
				const body = JSON.parse(options?.body as string)
				expect(body.minAge).toBeUndefined()
				expect(body.maxAge).toBeUndefined()

				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						groupMatching: {
							id: 'matching-456',
							guestId: 'guest-123',
							requestedCastCount: 2,
							status: 'pending',
							proposedDate: new Date(Date.now() + 3600000),
							proposedDuration: 120,
							proposedLocation: '新宿駅周辺',
							totalPoints: 12000,
						},
						participantCount: 5,
					}),
				} as Response)
			})

			render(
				<TestWrapper>
					<GroupMatchingOfferForm onSuccess={onSuccess} />
				</TestWrapper>,
			)

			// 年齢フィルタを入力しない

			// 場所を入力
			const locationInput = page.getByPlaceholder('例：渋谷駅周辺')
			await locationInput.fill('新宿駅周辺')

			// 送信ボタンをクリック
			const submitButton = page.getByRole('button', { name: 'オファーを送信' })
			await submitButton.click()

			// API呼び出しとonSuccessコールバックが呼ばれるのを待つ
			await vi.waitFor(
				() => {
					expect(mockFetch).toHaveBeenCalled()
					expect(onSuccess).toHaveBeenCalledWith(5)
				},
				{ timeout: 3000 },
			)
		})
	})

	describe('該当キャストが0人の場合', () => {
		it('条件に合うキャストが0人の場合にダイアログが表示される', async () => {
			mockFetch.mockImplementation(() => {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						groupMatching: null,
						participantCount: 0,
					}),
				} as Response)
			})

			render(
				<TestWrapper>
					<GroupMatchingOfferForm />
				</TestWrapper>,
			)

			// 場所を入力
			const locationInput = page.getByPlaceholder('例：渋谷駅周辺')
			await locationInput.fill('渋谷駅周辺')

			// 送信ボタンをクリック
			const submitButton = page.getByRole('button', { name: 'オファーを送信' })
			await submitButton.click()

			// ダイアログが表示される
			await vi.waitFor(
				async () => {
					await expect
						.element(page.getByText('該当するキャストがいません'))
						.toBeInTheDocument()
				},
				{ timeout: 3000 },
			)

			// ダイアログの説明文も表示される
			await expect
				.element(
					page.getByText(
						'指定された条件に合うキャストが見つかりませんでした。 条件を変更して再度お試しください。',
					),
				)
				.toBeInTheDocument()
		})

		it('ダイアログのOKボタンをクリックするとダイアログが閉じる', async () => {
			mockFetch.mockImplementation(() => {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						groupMatching: null,
						participantCount: 0,
					}),
				} as Response)
			})

			render(
				<TestWrapper>
					<GroupMatchingOfferForm />
				</TestWrapper>,
			)

			// 場所を入力
			const locationInput = page.getByPlaceholder('例：渋谷駅周辺')
			await locationInput.fill('渋谷駅周辺')

			// 送信ボタンをクリック
			const submitButton = page.getByRole('button', { name: 'オファーを送信' })
			await submitButton.click()

			// ダイアログが表示される
			await vi.waitFor(
				async () => {
					await expect
						.element(page.getByText('該当するキャストがいません'))
						.toBeInTheDocument()
				},
				{ timeout: 3000 },
			)

			// OKボタンをクリック
			const okButton = page.getByRole('button', { name: 'OK' })
			await okButton.click()

			// ダイアログが閉じる
			await vi.waitFor(
				async () => {
					await expect
						.element(page.getByText('該当するキャストがいません'))
						.not.toBeInTheDocument()
				},
				{ timeout: 3000 },
			)
		})

		it('0人の場合はonSuccessコールバックは呼ばれない', async () => {
			mockFetch.mockImplementation(() => {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						groupMatching: null,
						participantCount: 0,
					}),
				} as Response)
			})

			const onSuccess = vi.fn()

			render(
				<TestWrapper>
					<GroupMatchingOfferForm onSuccess={onSuccess} />
				</TestWrapper>,
			)

			// 場所を入力
			const locationInput = page.getByPlaceholder('例：渋谷駅周辺')
			await locationInput.fill('渋谷駅周辺')

			// 送信ボタンをクリック
			const submitButton = page.getByRole('button', { name: 'オファーを送信' })
			await submitButton.click()

			// ダイアログが表示される
			await vi.waitFor(
				async () => {
					await expect
						.element(page.getByText('該当するキャストがいません'))
						.toBeInTheDocument()
				},
				{ timeout: 3000 },
			)

			// onSuccessは呼ばれていない
			expect(onSuccess).not.toHaveBeenCalled()
		})

		it('0人の場合はフォームがリセットされない', async () => {
			mockFetch.mockImplementation(() => {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						groupMatching: null,
						participantCount: 0,
					}),
				} as Response)
			})

			render(
				<TestWrapper>
					<GroupMatchingOfferForm />
				</TestWrapper>,
			)

			// 人数を5人に変更
			const castCountSelect = page.getByRole('combobox').first()
			await castCountSelect.click()
			await page.getByRole('option', { name: '5人' }).click()

			// 場所を入力
			const locationInput = page.getByPlaceholder('例：渋谷駅周辺')
			await locationInput.fill('渋谷駅周辺')

			// 5人 × 2時間 × 3000 = 30,000ポイント
			await expect.element(page.getByText('30,000ポイント')).toBeInTheDocument()

			// 送信ボタンをクリック
			const submitButton = page.getByRole('button', { name: 'オファーを送信' })
			await submitButton.click()

			// ダイアログが表示される
			await vi.waitFor(
				async () => {
					await expect
						.element(page.getByText('該当するキャストがいません'))
						.toBeInTheDocument()
				},
				{ timeout: 3000 },
			)

			// OKボタンをクリックしてダイアログを閉じる
			const okButton = page.getByRole('button', { name: 'OK' })
			await okButton.click()

			// フォームの値はリセットされていない（30,000ポイントのまま）
			await expect.element(page.getByText('30,000ポイント')).toBeInTheDocument()

			// 場所も入力されたまま
			await expect.element(locationInput).toHaveValue('渋谷駅周辺')
		})
	})

	describe('フォームリセット', () => {
		it('送信成功後にフォームがリセットされる', async () => {
			const mockGroupMatching = {
				id: 'matching-123',
				guestId: 'guest-123',
				requestedCastCount: 5,
				status: 'pending' as const,
				proposedDate: new Date(Date.now() + 3600000),
				proposedDuration: 180,
				proposedLocation: '池袋',
				totalPoints: 45000,
			}

			mockFetch.mockImplementation(() => {
				return Promise.resolve({
					ok: true,
					json: async () => ({
						success: true,
						groupMatching: mockGroupMatching,
						participantCount: 4,
					}),
				} as Response)
			})

			const onSuccess = vi.fn()

			render(
				<TestWrapper>
					<GroupMatchingOfferForm onSuccess={onSuccess} />
				</TestWrapper>,
			)

			// 人数を5人に変更
			const castCountSelect = page.getByRole('combobox').first()
			await castCountSelect.click()
			await page.getByRole('option', { name: '5人' }).click()

			// 時間を3時間に変更
			const durationSelect = page.getByRole('combobox').nth(2)
			await durationSelect.click()
			await page.getByRole('option', { name: '3時間', exact: true }).click()

			// 場所を入力
			const locationInput = page.getByPlaceholder('例：渋谷駅周辺')
			await locationInput.fill('池袋')

			// 5人 × 3時間 × 3000 = 45,000ポイント
			await expect.element(page.getByText('45,000ポイント')).toBeInTheDocument()

			// 送信
			const submitButton = page.getByRole('button', { name: 'オファーを送信' })
			await submitButton.click()

			// 成功を待つ
			await vi.waitFor(
				() => {
					expect(onSuccess).toHaveBeenCalledWith(4)
				},
				{ timeout: 3000 },
			)

			// フォームがデフォルト値にリセットされる
			// 合計ポイントがデフォルトの12,000ポイントに戻る
			await expect.element(page.getByText('12,000ポイント')).toBeInTheDocument()
		})
	})
})
