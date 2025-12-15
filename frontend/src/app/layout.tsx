import type { Metadata } from 'next'
import '@/app/globals.css'
import { AuthProvider } from '@/features/auth/components/providers/AuthProvider'
import { ReactQueryProvider } from '@/libs/react-query/provider'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
	title: 'Kurumee',
	description: 'キャストとゲストをつなぐギャラ飲みプラットフォーム',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="ja">
			<body>
				<AuthProvider>
					<ReactQueryProvider>
						{children}
						<Toaster position="top-right" richColors />
					</ReactQueryProvider>
				</AuthProvider>
			</body>
		</html>
	)
}
