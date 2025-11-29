/**
 * useRegisterUser hook 統合テスト
 *
 * プロフィール登録mutationの動作を検証
 * API呼び出し、成功/エラーハンドリングをテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// hono/client のモック（hoisting対応）
const mockPost = vi.fn()

vi.mock('hono/client', () => ({
	hc: () => ({
		api: {
			users: {
				profile: {
					create: {
						$post: mockPost,
					},
				},
			},
		},
	}),
}))

// モック後にインポート
const { useRegisterUser } =
	await import('@/features/user/hooks/useRegisterUser')

// テスト用のコンポーネント
function TestComponent() {
	const mutation = useRegisterUser()

	return (
		<div>
			<div data-testid="status">{mutation.status}</div>
			<div data-testid="isLoading">{String(mutation.isPending)}</div>
			<div data-testid="isSuccess">{String(mutation.isSuccess)}</div>
			<div data-testid="isError">{String(mutation.isError)}</div>
			<div data-testid="error">{mutation.error?.message || 'none'}</div>
			<div data-testid="data">
				{mutation.data ? JSON.stringify(mutation.data) : 'none'}
			</div>
			<button
				onClick={() =>
					mutation.mutate({
						name: 'テストユーザー',
						birthDate: '1990-01-01',
						userType: 'guest',
					})
				}
				data-testid="register-guest-btn"
			>
				Register Guest
			</button>
			<button
				onClick={() =>
					mutation.mutate({
						name: 'テストキャスト',
						birthDate: '1995-05-05',
						userType: 'cast',
					})
				}
				data-testid="register-cast-btn"
			>
				Register Cast
			</button>
			<button onClick={() => mutation.reset()} data-testid="reset-btn">
				Reset
			</button>
		</div>
	)
}

// テスト用のラッパー
function createTestWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
			mutations: {
				retry: false,
			},
		},
	})

	return function TestWrapper({ children }: { children: React.ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		)
	}
}

describe('useRegisterUser', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.resetAllMocks()
	})

	describe('初期状態', () => {
		it('初期状態では idle 状態', async () => {
			const TestWrapper = createTestWrapper()

			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			)

			await expect.element(page.getByTestId('status')).toHaveTextContent('idle')
			await expect
				.element(page.getByTestId('isLoading'))
				.toHaveTextContent('false')
			await expect
				.element(page.getByTestId('isSuccess'))
				.toHaveTextContent('false')
			await expect
				.element(page.getByTestId('isError'))
				.toHaveTextContent('false')
		})
	})

	describe('成功ケース', () => {
		it('ゲスト登録が成功した場合、成功状態になる', async () => {
			const mockResponse = {
				success: true,
				user: { id: 'user-123', name: 'テストユーザー' },
			}
			mockPost.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			})

			const TestWrapper = createTestWrapper()

			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			)

			await page.getByTestId('register-guest-btn').click()

			// 成功状態を確認
			await expect
				.element(page.getByTestId('isSuccess'))
				.toHaveTextContent('true')
			await expect
				.element(page.getByTestId('isLoading'))
				.toHaveTextContent('false')

			// APIが正しい引数で呼ばれたことを確認
			expect(mockPost).toHaveBeenCalledWith({
				json: {
					name: 'テストユーザー',
					birthDate: '1990-01-01',
					userType: 'guest',
				},
			})
		})

		it('キャスト登録が成功した場合、成功状態になる', async () => {
			const mockResponse = {
				success: true,
				user: { id: 'user-456', name: 'テストキャスト' },
			}
			mockPost.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			})

			const TestWrapper = createTestWrapper()

			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			)

			await page.getByTestId('register-cast-btn').click()

			await expect
				.element(page.getByTestId('isSuccess'))
				.toHaveTextContent('true')

			expect(mockPost).toHaveBeenCalledWith({
				json: {
					name: 'テストキャスト',
					birthDate: '1995-05-05',
					userType: 'cast',
				},
			})
		})

		it('成功時にレスポンスデータが data に設定される', async () => {
			const mockResponse = {
				success: true,
				user: { id: 'user-789', name: 'テスト' },
			}
			mockPost.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			})

			const TestWrapper = createTestWrapper()

			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			)

			await page.getByTestId('register-guest-btn').click()

			await expect
				.element(page.getByTestId('isSuccess'))
				.toHaveTextContent('true')
			await expect
				.element(page.getByTestId('data'))
				.toHaveTextContent(JSON.stringify(mockResponse))
		})
	})

	describe('エラーケース', () => {
		it('APIがエラーを返した場合、エラー状態になる', async () => {
			mockPost.mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ error: '認証が必要です' }),
			})

			const TestWrapper = createTestWrapper()

			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			)

			await page.getByTestId('register-guest-btn').click()

			await expect
				.element(page.getByTestId('isError'))
				.toHaveTextContent('true')
			await expect
				.element(page.getByTestId('error'))
				.toHaveTextContent('認証が必要です')
		})

		it('バリデーションエラーの場合、エラーメッセージが設定される', async () => {
			mockPost.mockResolvedValue({
				ok: false,
				json: () =>
					Promise.resolve({ error: '名前は2文字以上で入力してください' }),
			})

			const TestWrapper = createTestWrapper()

			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			)

			await page.getByTestId('register-guest-btn').click()

			await expect
				.element(page.getByTestId('isError'))
				.toHaveTextContent('true')
			await expect
				.element(page.getByTestId('error'))
				.toHaveTextContent('名前は2文字以上で入力してください')
		})

		it('エラーレスポンスに error フィールドがない場合、デフォルトメッセージを使用', async () => {
			mockPost.mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({}),
			})

			const TestWrapper = createTestWrapper()

			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			)

			await page.getByTestId('register-guest-btn').click()

			await expect
				.element(page.getByTestId('isError'))
				.toHaveTextContent('true')
			await expect
				.element(page.getByTestId('error'))
				.toHaveTextContent('登録に失敗しました')
		})

		it('ネットワークエラーの場合、エラー状態になる', async () => {
			mockPost.mockRejectedValue(new Error('Network Error'))

			const TestWrapper = createTestWrapper()

			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			)

			await page.getByTestId('register-guest-btn').click()

			await expect
				.element(page.getByTestId('isError'))
				.toHaveTextContent('true')
			await expect
				.element(page.getByTestId('error'))
				.toHaveTextContent('Network Error')
		})
	})

	describe('リセット機能', () => {
		it('reset を呼ぶと状態がリセットされる', async () => {
			const mockResponse = {
				success: true,
				user: { id: 'user-123', name: 'テストユーザー' },
			}
			mockPost.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			})

			const TestWrapper = createTestWrapper()

			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			)

			// 登録を実行
			await page.getByTestId('register-guest-btn').click()
			await expect
				.element(page.getByTestId('isSuccess'))
				.toHaveTextContent('true')

			// リセット
			await page.getByTestId('reset-btn').click()

			await expect.element(page.getByTestId('status')).toHaveTextContent('idle')
			await expect
				.element(page.getByTestId('isSuccess'))
				.toHaveTextContent('false')
			await expect.element(page.getByTestId('data')).toHaveTextContent('none')
		})

		it('エラー状態からリセットできる', async () => {
			mockPost.mockResolvedValue({
				ok: false,
				json: () => Promise.resolve({ error: 'エラー' }),
			})

			const TestWrapper = createTestWrapper()

			render(
				<TestWrapper>
					<TestComponent />
				</TestWrapper>,
			)

			// エラーを発生させる
			await page.getByTestId('register-guest-btn').click()
			await expect
				.element(page.getByTestId('isError'))
				.toHaveTextContent('true')

			// リセット
			await page.getByTestId('reset-btn').click()

			await expect.element(page.getByTestId('status')).toHaveTextContent('idle')
			await expect
				.element(page.getByTestId('isError'))
				.toHaveTextContent('false')
			await expect.element(page.getByTestId('error')).toHaveTextContent('none')
		})
	})
})
