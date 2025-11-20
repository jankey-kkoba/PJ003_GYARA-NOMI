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
    name: 'Test User',
    email: 'test@example.com',
    image: null,
  },
}

// useSession の戻り値を設定するヘルパー
export function setSessionStatus(status: 'authenticated' | 'loading' | 'unauthenticated') {
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
