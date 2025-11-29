import { auth } from '@/libs/auth'
import { PUBLIC_PATHS, ROUTES } from '@/libs/constants/routes'
import { NextResponse } from 'next/server'

/**
 * 認証ミドルウェア
 * 保護されたルートへのアクセスを制御する
 */
export default auth((req) => {
	const isAuthenticated = !!req.auth
	const { pathname } = req.nextUrl

	// 公開ルート（認証不要）
	const isPublicRoute = PUBLIC_PATHS.some((route) => pathname.startsWith(route))

	// 未認証で保護されたルートにアクセスした場合
	if (!isAuthenticated && !isPublicRoute) {
		const loginUrl = new URL(ROUTES.LOGIN, req.url)
		return NextResponse.redirect(loginUrl)
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

// Node.jsランタイムを使用（postgres.jsがEdgeランタイムで動作しないため）
export const runtime = 'nodejs'
