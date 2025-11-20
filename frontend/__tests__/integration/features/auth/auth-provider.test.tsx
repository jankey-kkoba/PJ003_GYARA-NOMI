/**
 * AuthProvider 統合テスト
 *
 * 認証プロバイダーコンポーネントの動作を検証
 * SessionProviderラッピング、子コンポーネントのレンダリングをテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { AuthProvider } from '@/features/auth/components/providers/AuthProvider'
import { useSession } from 'next-auth/react'

// next-auth/react のモック
const mockUseSession = vi.fn()

vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
  useSession: () => mockUseSession(),
}))

// テスト用コンポーネント（認証状態を表示）
function TestChild() {
  const session = useSession()

  return (
    <div>
      <div data-testid="status">{session.status}</div>
      <div data-testid="user-email">{session.data?.user?.email || 'none'}</div>
      <div data-testid="child-content">Child Content</div>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('レンダリング', () => {
    it('子コンポーネントをレンダリングする', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(
        <AuthProvider>
          <div data-testid="test-child">Test Child</div>
        </AuthProvider>
      )

      await expect.element(page.getByTestId('test-child')).toHaveTextContent('Test Child')
    })

    it('複数の子コンポーネントをレンダリングする', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(
        <AuthProvider>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </AuthProvider>
      )

      await expect.element(page.getByTestId('child-1')).toHaveTextContent('Child 1')
      await expect.element(page.getByTestId('child-2')).toHaveTextContent('Child 2')
      await expect.element(page.getByTestId('child-3')).toHaveTextContent('Child 3')
    })

    it('SessionProvider でラップされる', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(
        <AuthProvider>
          <div data-testid="test-child">Test</div>
        </AuthProvider>
      )

      // SessionProvider のモックが描画されることを確認
      await expect.element(page.getByTestId('session-provider')).toBeInTheDocument()
    })
  })

  describe('認証状態の伝播', () => {
    it('未認証状態が子コンポーネントに伝わる', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )

      await expect.element(page.getByTestId('status')).toHaveTextContent('unauthenticated')
      await expect.element(page.getByTestId('user-email')).toHaveTextContent('none')
    })

    it('認証済み状態が子コンポーネントに伝わる', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: 'authenticated',
      })

      render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )

      await expect.element(page.getByTestId('status')).toHaveTextContent('authenticated')
      await expect.element(page.getByTestId('user-email')).toHaveTextContent('test@example.com')
    })

    it('ローディング状態が子コンポーネントに伝わる', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(
        <AuthProvider>
          <TestChild />
        </AuthProvider>
      )

      await expect.element(page.getByTestId('status')).toHaveTextContent('loading')
      await expect.element(page.getByTestId('user-email')).toHaveTextContent('none')
    })
  })

  describe('ネストされた構造', () => {
    it('ネストされたコンポーネントツリーをレンダリングする', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(
        <AuthProvider>
          <div data-testid="parent">
            Parent
            <div data-testid="child">
              Child
              <div data-testid="grandchild">Grandchild</div>
            </div>
          </div>
        </AuthProvider>
      )

      await expect.element(page.getByTestId('parent')).toBeInTheDocument()
      await expect.element(page.getByTestId('child')).toBeInTheDocument()
      await expect.element(page.getByTestId('grandchild')).toBeInTheDocument()
    })

    it('複雑なコンポーネント構造で認証状態が伝わる', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-456',
            email: 'nested@example.com',
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: 'authenticated',
      })

      render(
        <AuthProvider>
          <div>
            <div>
              <TestChild />
            </div>
          </div>
        </AuthProvider>
      )

      await expect.element(page.getByTestId('status')).toHaveTextContent('authenticated')
      await expect.element(page.getByTestId('user-email')).toHaveTextContent('nested@example.com')
    })
  })

  describe('children のタイプ', () => {
    it('null を children として渡せる', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<AuthProvider>{null}</AuthProvider>)

      // エラーなくレンダリングされることを確認
      await expect.element(page.getByTestId('session-provider')).toBeInTheDocument()
    })

    it('文字列を children として渡せる', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<AuthProvider>Plain text content</AuthProvider>)

      await expect
        .element(page.getByTestId('session-provider'))
        .toHaveTextContent('Plain text content')
    })

    it('Fragment を children として渡せる', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(
        <AuthProvider>
          <>
            <div data-testid="fragment-1">Fragment 1</div>
            <div data-testid="fragment-2">Fragment 2</div>
          </>
        </AuthProvider>
      )

      await expect.element(page.getByTestId('fragment-1')).toHaveTextContent('Fragment 1')
      await expect.element(page.getByTestId('fragment-2')).toHaveTextContent('Fragment 2')
    })
  })
})
