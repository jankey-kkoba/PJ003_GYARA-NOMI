import { auth } from '@/libs/auth'
import { NextResponse } from 'next/server'

/**
 * 認証ミドルウェア
 * 保護されたルートへのアクセスを制御する
 */
export default auth((req) => {
  const isAuthenticated = !!req.auth
  const { pathname } = req.nextUrl

  // 公開ルート（認証不要）
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // 未認証で保護されたルートにアクセスした場合
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // 認証済みでログインページにアクセスした場合
  if (isAuthenticated && isPublicRoute) {
    const homeUrl = new URL('/', req.url)
    // ログイン成功フラグを追加
    homeUrl.searchParams.set('login', 'success')
    return NextResponse.redirect(homeUrl)
  }

  return NextResponse.next()
})

/**
 * ミドルウェアを適用するパス
 * API routes、静的ファイル、画像は除外
 */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
