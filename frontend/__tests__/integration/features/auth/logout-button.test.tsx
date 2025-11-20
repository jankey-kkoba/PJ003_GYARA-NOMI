/**
 * LogoutButton 統合テスト
 *
 * ログアウトボタンコンポーネントの動作を検証
 * レンダリング、クリックイベント、バリアント表示をテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { LogoutButton } from '@/features/auth/components/atoms/LogoutButton'
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

// 認証済みセッション
const authenticatedSession: Session = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
}

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('レンダリング', () => {
    it('ログアウトボタンが表示される', async () => {
      render(
        <TestWrapper session={authenticatedSession}>
          <LogoutButton />
        </TestWrapper>
      )

      await expect.element(page.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument()
    })

    it('認証されていない場合でもボタンは表示される', async () => {
      render(
        <TestWrapper session={null}>
          <LogoutButton />
        </TestWrapper>
      )

      await expect.element(page.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument()
    })
  })

  describe('バリアント', () => {
    it('デフォルトバリアントでレンダリングされる', async () => {
      render(
        <TestWrapper session={authenticatedSession}>
          <LogoutButton />
        </TestWrapper>
      )

      await expect.element(page.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument()
    })

    it('secondary バリアントを指定できる', async () => {
      render(
        <TestWrapper session={authenticatedSession}>
          <LogoutButton variant="secondary" />
        </TestWrapper>
      )

      await expect.element(page.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument()
    })

    it('destructive バリアントを指定できる', async () => {
      render(
        <TestWrapper session={authenticatedSession}>
          <LogoutButton variant="destructive" />
        </TestWrapper>
      )

      await expect.element(page.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument()
    })

    it('ghost バリアントを指定できる', async () => {
      render(
        <TestWrapper session={authenticatedSession}>
          <LogoutButton variant="ghost" />
        </TestWrapper>
      )

      await expect.element(page.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument()
    })
  })

  describe('クリックイベント', () => {
    it('ボタンクリックで logout が呼ばれる', async () => {
      render(
        <TestWrapper session={authenticatedSession}>
          <LogoutButton />
        </TestWrapper>
      )

      await page.getByRole('button', { name: 'ログアウト' }).click()

      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    it('複数回クリックすると logout が複数回呼ばれる', async () => {
      render(
        <TestWrapper session={authenticatedSession}>
          <LogoutButton />
        </TestWrapper>
      )

      const button = page.getByRole('button', { name: 'ログアウト' })
      await button.click()
      await button.click()
      await button.click()

      expect(mockSignOut).toHaveBeenCalledTimes(3)
    })

    it('未認証状態でもボタンクリックで logout が呼ばれる', async () => {
      render(
        <TestWrapper session={null}>
          <LogoutButton />
        </TestWrapper>
      )

      await page.getByRole('button', { name: 'ログアウト' }).click()

      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
  })

  describe('アクセシビリティ', () => {
    it('button role でアクセス可能', async () => {
      render(
        <TestWrapper session={authenticatedSession}>
          <LogoutButton />
        </TestWrapper>
      )

      const button = page.getByRole('button', { name: 'ログアウト' })
      await expect.element(button).toBeInTheDocument()
    })

    it('ボタンにテキストが含まれている', async () => {
      render(
        <TestWrapper session={authenticatedSession}>
          <LogoutButton />
        </TestWrapper>
      )

      await expect
        .element(page.getByRole('button', { name: 'ログアウト' }))
        .toHaveTextContent('ログアウト')
    })
  })
})
