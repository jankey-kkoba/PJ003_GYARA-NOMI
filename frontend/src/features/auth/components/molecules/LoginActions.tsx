'use client'

import Link from 'next/link'
import { LineLoginButton } from '@/features/auth/components/atoms/LineLoginButton'

/**
 * ログインボタンエリアコンポーネント
 * LINEログインボタンと利用規約への同意文言を表示
 */
export function LoginActions() {
	return (
		<div className="space-y-4">
			<LineLoginButton />

			<p className="text-center text-xs text-muted-foreground">
				ログインすることで
				<Link href="#" className="text-primary hover:underline">
					利用規約
				</Link>
				と
				<Link href="#" className="text-primary hover:underline">
					プライバシーポリシー
				</Link>
				に同意したものとみなされます
			</p>
		</div>
	)
}
