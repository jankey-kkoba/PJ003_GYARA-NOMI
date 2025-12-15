import Image from 'next/image'

import { LoginActions } from '@/features/auth/components/molecules/LoginActions'
import { SignUpLinks } from '@/features/auth/components/molecules/SignUpLinks'

type LoginTemplateProps = {
	children?: React.ReactNode
}

/**
 * ログインページのテンプレート
 * Mobile Firstで実装
 */
export function LoginTemplate({ children }: LoginTemplateProps) {
	return (
		<div className="flex min-h-screen flex-col items-center bg-background px-4 pt-12">
			<div className="w-full max-w-md space-y-8">
				{/* ロゴ・タイトルエリア */}
				<div className="flex flex-col items-center text-center">
					<Image
						src="/logo.png"
						alt="Kurumee"
						width={254}
						height={58}
						priority
						className="mb-4"
					/>
					<p className="text-sm text-muted-foreground">
						キャストとゲストをつなぐプラットフォーム
					</p>
				</div>

				{/* 子コンポーネント（開発環境用ログインフォームなど） */}
				{children}

				{/* ログインボタンエリア */}
				<LoginActions />

				{/* サインアップリンク */}
				<SignUpLinks />
			</div>
		</div>
	)
}
