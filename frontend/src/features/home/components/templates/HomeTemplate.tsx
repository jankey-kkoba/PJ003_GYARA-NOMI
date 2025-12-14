'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ROUTES } from '@/libs/constants/routes'
import { MatchingStatusList } from '@/features/solo-matching/components/organisms/MatchingStatusList'
import { CastMatchingStatusList } from '@/features/solo-matching/components/organisms/CastMatchingStatusList'
import { CompletedMatchingList } from '@/features/solo-matching/components/organisms/CompletedMatchingList'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { UserProfileSection } from '@/features/home/components/molecules/UserProfileSection'
import { HowToSection } from '@/features/home/components/molecules/HowToSection'
import { AvailableCastsSection } from '@/features/home/components/organisms/AvailableCastsSection'

/**
 * ホームページのテンプレート
 * 認証チェックはMiddlewareで行うため、ここでは行わない
 */
export function HomeTemplate() {
	const { user } = useAuth()
	const userRole = user?.role

	return (
		<div className="flex min-h-screen flex-col bg-background px-4 py-4 md:py-8">
			<div className="mx-auto w-full max-w-md md:max-w-4xl space-y-4 md:space-y-6">
				{/* プロフィールセクション */}
				<UserProfileSection />

				{/* CTAボタン（ゲストのみ） */}
				{userRole === 'guest' && (
					<Button
						asChild
						size="lg"
						className="w-full text-base md:text-lg font-bold py-6"
					>
						<Link href={ROUTES.GROUP_MATCHING.OFFER}>キャストを呼ぶ</Link>
					</Button>
				)}

				{/* 使い方セクション（ゲストのみ） */}
				{userRole === 'guest' && <HowToSection />}

				{/* キャスト一覧（ゲストのみ） */}
				{userRole === 'guest' && <AvailableCastsSection />}

				{/* マッチング状況 */}
				<Card>
					<CardHeader className="pb-2 md:pb-4">
						<CardTitle className="text-base md:text-lg">
							マッチング状況
						</CardTitle>
					</CardHeader>
					<CardContent>
						{userRole === 'guest' ? (
							<MatchingStatusList />
						) : userRole === 'cast' ? (
							<CastMatchingStatusList />
						) : (
							<div className="flex min-h-[100px] items-center justify-center">
								<p className="text-muted-foreground">
									ロールを確認しています...
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* 完了済みマッチング（ゲストのみ） */}
				{userRole === 'guest' && (
					<Card>
						<CardHeader className="pb-2 md:pb-4">
							<CardTitle className="text-base md:text-lg">
								完了済みマッチング
							</CardTitle>
						</CardHeader>
						<CardContent>
							<CompletedMatchingList />
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	)
}
