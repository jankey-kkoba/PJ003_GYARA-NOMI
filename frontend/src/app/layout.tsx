import type { Metadata } from 'next'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'ギャラ飲みプラットフォーム',
  description: 'キャストとゲストをつなぐギャラ飲みプラットフォーム',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
