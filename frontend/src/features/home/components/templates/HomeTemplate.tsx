'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/libs/constants/routes'
import { LogoutButton } from '@/features/auth/components/atoms/LogoutButton'
import { MatchingStatusList } from '@/features/solo-matching/components/organisms/MatchingStatusList'
import { CastMatchingStatusList } from '@/features/solo-matching/components/organisms/CastMatchingStatusList'
import { CompletedMatchingList } from '@/features/solo-matching/components/organisms/CompletedMatchingList'
import { useAuth } from '@/features/auth/hooks/useAuth'

/**
 * ホームページのテンプレート
 * 認証チェックはMiddlewareで行うため、ここでは行わない
 */
export function HomeTemplate() {
	const { user } = useAuth()
	const userRole = user?.role

	return (
		<div className="flex min-h-screen flex-col bg-background px-4 py-8">
			<div className="mx-auto w-full max-w-md space-y-6">
				<div className="rounded-lg bg-card p-6 shadow">
					<h1 className="mb-4 text-2xl font-bold text-foreground">
						ギャラ飲みプラットフォーム
					</h1>
					<p className="mb-4 text-muted-foreground">ようこそ</p>

					<div className="space-y-3">
						{userRole === 'guest' && (
							<>
								<Button asChild className="w-full">
									<Link href={ROUTES.CASTS.LIST}>キャスト一覧を見る</Link>
								</Button>
								<Button asChild variant="secondary" className="w-full">
									<Link href={ROUTES.GROUP_MATCHING.OFFER}>呼ぶ</Link>
								</Button>
							</>
						)}

						{userRole === 'cast' && (
							<Button asChild className="w-full">
								<Link href={ROUTES.PROFILE.EDIT}>プロフィールを編集</Link>
							</Button>
						)}

						<LogoutButton variant="outline" className="w-full" />
					</div>
				</div>

				{/* マッチング状況 */}
				<div className="rounded-lg bg-card p-6 shadow">
					<h2 className="mb-4 text-lg font-semibold text-foreground">
						マッチング状況
					</h2>
					{userRole === 'guest' ? (
						<MatchingStatusList />
					) : userRole === 'cast' ? (
						<CastMatchingStatusList />
					) : (
						<div className="flex min-h-[200px] items-center justify-center">
							<p className="text-muted-foreground">ロールを確認しています...</p>
						</div>
					)}
				</div>

				{/* 完了済みマッチング（ゲストのみ） */}
				{userRole === 'guest' && (
					<div className="rounded-lg bg-card p-6 shadow">
						<h2 className="mb-4 text-lg font-semibold text-foreground">
							完了済みマッチング
						</h2>
						<CompletedMatchingList />
					</div>
				)}
			</div>
		</div>
	)
}
