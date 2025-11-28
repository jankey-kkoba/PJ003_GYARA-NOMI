import Link from 'next/link'

/**
 * 公開ページ用レイアウト
 * 認証不要でアクセス可能なページ（使い方、FAQ、利用規約等）
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-foreground">
            ギャラ飲み
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/guide"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              使い方
            </Link>
            <Link
              href="/login"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              ログイン
            </Link>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <article className="prose prose-neutral dark:prose-invert max-w-3xl mx-auto">
          {children}
        </article>
      </main>

      {/* フッター */}
      <footer className="border-t border-border bg-muted/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ギャラ飲みプラットフォーム
            </p>
            <nav className="flex items-center gap-4">
              <Link
                href="/guide"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                使い方
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                利用規約
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                プライバシーポリシー
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
