/**
 * HomeTemplate 統合テスト
 *
 * ホームページテンプレートの基本表示を検証
 * 現状はウェルカムメッセージの表示のみを確認
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { HomeTemplate } from '@/features/home/components/templates/HomeTemplate'
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

describe('HomeTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本表示', () => {
    it('ウェルカムメッセージが表示される', async () => {
      render(
        <TestWrapper session={authenticatedSession}>
          <HomeTemplate />
        </TestWrapper>
      )

      await expect.element(page.getByText('ようこそ')).toBeInTheDocument()
    })

    it('ページタイトルが表示される', async () => {
      render(
        <TestWrapper session={authenticatedSession}>
          <HomeTemplate />
        </TestWrapper>
      )

      await expect
        .element(page.getByRole('heading', { name: 'ギャラ飲みプラットフォーム', level: 1 }))
        .toBeInTheDocument()
    })

    it('ログアウトボタンが表示される', async () => {
      render(
        <TestWrapper session={authenticatedSession}>
          <HomeTemplate />
        </TestWrapper>
      )

      await expect.element(page.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument()
    })
  })
})
