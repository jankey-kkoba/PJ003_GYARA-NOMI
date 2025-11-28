'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

/**
 * Credentialsログインフォーム
 * 開発環境のテストユーザーログインと管理者ログインで使用
 */
export interface CredentialsLoginFormProps {
	/** カードのタイトル */
	title?: string
	/** カードの説明文 */
	description?: string
	/** 開発環境用のヘルプテキストを表示するか */
	showDevHelpText?: boolean
	/** 表示バリアント（dev: 開発環境用の黄色いスタイル） */
	variant?: 'default' | 'dev'
}

export function CredentialsLoginForm({
	title = 'ログイン',
	description,
	showDevHelpText = false,
	variant = 'default',
}: CredentialsLoginFormProps) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setIsLoading(true)

		try {
			await signIn('credentials', {
				email,
				password,
				redirect: true,
				callbackUrl: '/',
			})
			// redirect: true の場合、成功時は自動的にリダイレクトされる
			// エラー時のみここに到達する
		} catch {
			setError(
				'ログインに失敗しました。メールアドレスとパスワードを確認してください。',
			)
			setIsLoading(false)
		}
	}

	const cardClassName =
		variant === 'dev' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : ''

	return (
		<Card className={cardClassName}>
			<CardHeader>
				<CardTitle className="text-sm">{title}</CardTitle>
				{description && (
					<CardDescription className="text-xs">{description}</CardDescription>
				)}
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="credentials-email" className="text-xs">
							メールアドレス
						</Label>
						<Input
							id="credentials-email"
							name="email"
							type="email"
							placeholder="email@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="h-9 text-sm"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="credentials-password" className="text-xs">
							パスワード
						</Label>
						<Input
							id="credentials-password"
							name="password"
							type="password"
							placeholder="パスワード"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="h-9 text-sm"
						/>
					</div>

					{error && <p className="text-xs text-red-600">{error}</p>}

					<Button
						type="submit"
						disabled={isLoading}
						className="h-9 w-full text-sm"
					>
						{isLoading ? 'ログイン中...' : 'ログイン'}
					</Button>

					{showDevHelpText && (
						<div className="mt-2 space-y-1 text-xs text-muted-foreground">
							<p>テストユーザー:</p>
							<p>- ゲスト: test-guest@example.com</p>
							<p>- キャスト: test-cast@example.com</p>
							<p>パスワード: dev-password-2024</p>
						</div>
					)}
				</form>
			</CardContent>
		</Card>
	)
}
