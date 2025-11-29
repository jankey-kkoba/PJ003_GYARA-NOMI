/**
 * useAuth hook 統合テスト
 *
 * 認証フックの動作を検証
 * セッション管理、ログイン/ログアウト処理をテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'

// next-auth/react のモック
const mockSignIn = vi.fn()
const mockSignOut = vi.fn()

vi.mock('next-auth/react', async () => {
	const actual = await vi.importActual('next-auth/react')
	return {
		...actual,
		signIn: (...args: unknown[]) => mockSignIn(...args),
		signOut: (...args: unknown[]) => mockSignOut(...args),
	}
})

// テスト用のコンポーネント（hook の値を表示）
function TestComponent() {
	const auth = useAuth()

	return (
		<div>
			<div data-testid="status">{auth.status}</div>
			<div data-testid="isAuthenticated">{String(auth.isAuthenticated)}</div>
			<div data-testid="isLoading">{String(auth.isLoading)}</div>
			<div data-testid="userId">{auth.user?.id || 'none'}</div>
			<div data-testid="userEmail">{auth.user?.email || 'none'}</div>
			<button onClick={() => auth.lineLogin()} data-testid="login-btn">
				Login
			</button>
			<button
				onClick={() => auth.lineLogin('guest')}
				data-testid="login-guest-btn"
			>
				Login Guest
			</button>
			<button
				onClick={() => auth.lineLogin('cast')}
				data-testid="login-cast-btn"
			>
				Login Cast
			</button>
			<button onClick={() => auth.logout()} data-testid="logout-btn">
				Logout
			</button>
		</div>
	)
}

// テスト用のラッパー
function TestWrapper({
	session,
	children,
}: {
	session: Session | null
	children: React.ReactNode
}) {
	return (
		<SessionProvider session={session} refetchInterval={0}>
			{children}
		</SessionProvider>
	)
}

describe('useAuth', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('セッション状態', () => {
		it('認証済みの場合 isAuthenticated が true を返す', async () => {
			const session: Session = {
				user: {
					id: 'user-123',
					email: 'test@example.com',
				},
				expires: new Date(Date.now() + 86400000).toISOString(),
			}

			render(
				<TestWrapper session={session}>
					<TestComponent />
				</TestWrapper>,
			)

			await expect
				.element(page.getByTestId('isAuthenticated'))
				.toHaveTextContent('true')
		})

		it('未認証の場合 isAuthenticated が false を返す', async () => {
			render(
				<TestWrapper session={null}>
					<TestComponent />
				</TestWrapper>,
			)

			await expect
				.element(page.getByTestId('isAuthenticated'))
				.toHaveTextContent('false')
		})

		it('セッションが存在する場合 user オブジェクトを返す', async () => {
			const session: Session = {
				user: {
					id: 'user-123',
					email: 'test@example.com',
				},
				expires: new Date(Date.now() + 86400000).toISOString(),
			}

			render(
				<TestWrapper session={session}>
					<TestComponent />
				</TestWrapper>,
			)

			await expect
				.element(page.getByTestId('userId'))
				.toHaveTextContent('user-123')
			await expect
				.element(page.getByTestId('userEmail'))
				.toHaveTextContent('test@example.com')
		})

		it('セッションが存在しない場合 user は none を表示する', async () => {
			render(
				<TestWrapper session={null}>
					<TestComponent />
				</TestWrapper>,
			)

			await expect.element(page.getByTestId('userId')).toHaveTextContent('none')
			await expect
				.element(page.getByTestId('userEmail'))
				.toHaveTextContent('none')
		})
	})

	describe('lineLogin', () => {
		it('userType なしで signIn を呼び出す', async () => {
			render(
				<TestWrapper session={null}>
					<TestComponent />
				</TestWrapper>,
			)

			await page.getByTestId('login-btn').click()

			expect(mockSignIn).toHaveBeenCalledWith('line', { callbackUrl: '/' })
		})

		it('userType=guest で signIn を呼び出す', async () => {
			render(
				<TestWrapper session={null}>
					<TestComponent />
				</TestWrapper>,
			)

			await page.getByTestId('login-guest-btn').click()

			expect(mockSignIn).toHaveBeenCalledWith('line', {
				callbackUrl: '/?userType=guest',
			})
		})

		it('userType=cast で signIn を呼び出す', async () => {
			render(
				<TestWrapper session={null}>
					<TestComponent />
				</TestWrapper>,
			)

			await page.getByTestId('login-cast-btn').click()

			expect(mockSignIn).toHaveBeenCalledWith('line', {
				callbackUrl: '/?userType=cast',
			})
		})
	})

	describe('logout', () => {
		it('signOut を呼び出す', async () => {
			const session: Session = {
				user: {
					id: 'user-123',
					email: 'test@example.com',
				},
				expires: new Date(Date.now() + 86400000).toISOString(),
			}

			render(
				<TestWrapper session={session}>
					<TestComponent />
				</TestWrapper>,
			)

			await page.getByTestId('logout-btn').click()

			expect(mockSignOut).toHaveBeenCalled()
		})
	})
})
