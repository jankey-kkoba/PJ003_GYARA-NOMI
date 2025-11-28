'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { CastProfilePhotoManager } from '@/features/cast-profile-photo/components/organisms/CastProfilePhotoManager'
import { PageLoading } from '@/components/molecules/PageLoading'

/**
 * キャストプロフィール編集画面テンプレート
 */
export function CastProfileEditTemplate() {
	const router = useRouter()
	const { user, isAuthenticated, isLoading } = useAuth()

	// ローディング中
	if (isLoading) {
		return <PageLoading />
	}

	// 未認証の場合
	if (!isAuthenticated) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4">
				<p className="text-destructive">ログインが必要です</p>
				<Button onClick={() => router.push('/login')}>ログインページへ</Button>
			</div>
		)
	}

	// キャストユーザー以外の場合
	if (user?.role !== 'cast') {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4">
				<p className="text-destructive">
					この機能はキャストユーザーのみ利用できます
				</p>
				<Button onClick={() => router.push('/')}>ホームに戻る</Button>
			</div>
		)
	}

	return (
		<div className="container max-w-4xl mx-auto py-6 px-4">
			{/* ヘッダー */}
			<div className="mb-6">
				<Button variant="ghost" onClick={() => router.back()} className="mb-4">
					← 戻る
				</Button>
				<h1 className="text-3xl font-bold">プロフィール編集</h1>
				<p className="text-muted-foreground mt-2">
					プロフィール情報と写真を管理できます
				</p>
			</div>

			<div className="space-y-6">
				{/* 写真管理セクション */}
				<Card>
					<CardHeader>
						<CardTitle>プロフィール写真</CardTitle>
						<CardDescription>
							プロフィール写真を追加・管理します。最低1枚は登録してください。
						</CardDescription>
					</CardHeader>
					<CardContent>
						<CastProfilePhotoManager castId={user.id} />
					</CardContent>
				</Card>

				{/* 今後、プロフィール情報編集フォームなどを追加 */}
			</div>
		</div>
	)
}
