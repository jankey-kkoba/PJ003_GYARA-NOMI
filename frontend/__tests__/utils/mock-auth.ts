/**
 * 認証関連のモック
 *
 * next-auth/react と useAuth フックのモック実装
 */

import { vi } from 'vitest'
import type { Session } from 'next-auth'

// next-auth/react のモック
export const mockSignIn = vi.fn()
export const mockSignOut = vi.fn()
export const mockUseSession = vi.fn()

// デフォルトの認証済みセッション
export const authenticatedSession: Session = {
	expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
	user: {
		id: 'test-user-id',
		email: 'test@example.com',
		role: 'guest',
	},
}

// useSession の戻り値を設定するヘルパー
export function setSessionStatus(
	status: 'authenticated' | 'loading' | 'unauthenticated',
) {
	switch (status) {
		case 'authenticated':
			mockUseSession.mockReturnValue({
				data: authenticatedSession,
				status: 'authenticated',
			})
			break
		case 'loading':
			mockUseSession.mockReturnValue({
				data: null,
				status: 'loading',
			})
			break
		case 'unauthenticated':
			mockUseSession.mockReturnValue({
				data: null,
				status: 'unauthenticated',
			})
			break
	}
}

// next-auth/react モジュールのモック設定
export function setupAuthMocks() {
	vi.mock('next-auth/react', () => ({
		useSession: mockUseSession,
		signIn: mockSignIn,
		signOut: mockSignOut,
		SessionProvider: ({ children }: { children: React.ReactNode }) => children,
	}))

	// デフォルトは未認証状態
	setSessionStatus('unauthenticated')
}

// モックのリセット
export function resetAuthMocks() {
	mockSignIn.mockReset()
	mockSignOut.mockReset()
	mockUseSession.mockReset()
	setSessionStatus('unauthenticated')
}

/**
 * Hono API テスト用の認証トークン型
 */
export type MockAuthToken = {
	id?: string
	role?: 'guest' | 'cast' | 'admin'
}

/**
 * Hono API テスト用のモック認証ミドルウェアを作成
 * verifyAuth() が authUser を context にセットする動作をエミュレート
 *
 * @param token モックする認証トークン（undefined の場合は未認証）
 */
export function createMockAuthMiddleware(token?: MockAuthToken) {
	return async (
		c: { set: (key: string, value: unknown) => void },
		next: () => Promise<void>,
	) => {
		// Auth.js の設定情報（verifyAuth が参照する）
		c.set('authConfig', {
			secret: 'test-secret',
			providers: [],
		})
		// authUser をセット（verifyAuth() が期待する形式）
		c.set('authUser', token ? { token } : { token: null })
		await next()
	}
}
