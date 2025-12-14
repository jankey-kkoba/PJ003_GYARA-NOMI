'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useUserProfile } from '@/features/user/hooks/useUserProfile'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * ユーザーのロールに応じたラベルを返す
 */
function getRoleLabel(role: string | null | undefined): string {
	switch (role) {
		case 'guest':
			return 'ゲスト'
		case 'cast':
			return 'キャスト'
		case 'admin':
			return '管理者'
		default:
			return ''
	}
}

/**
 * ユーザーのロールに応じたバッジのvariantを返す
 */
function getRoleBadgeVariant(
	role: string | null | undefined,
): 'default' | 'secondary' | 'outline' {
	switch (role) {
		case 'guest':
			return 'default'
		case 'cast':
			return 'secondary'
		default:
			return 'outline'
	}
}

/**
 * ホーム画面のユーザープロフィールセクション
 * ユーザー名とロールバッジを表示する
 */
export function UserProfileSection() {
	const { user } = useAuth()
	const { data: profile, isLoading } = useUserProfile()

	if (isLoading) {
		return (
			<Card>
				<CardContent className="flex items-center gap-4 p-4">
					<Skeleton className="h-12 w-12 md:h-16 md:w-16 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-24 md:h-5 md:w-32" />
						<Skeleton className="h-4 w-16" />
					</div>
				</CardContent>
			</Card>
		)
	}

	const displayName = profile?.name || 'ユーザー'
	const initial = displayName.charAt(0)
	const roleLabel = getRoleLabel(user?.role)
	const badgeVariant = getRoleBadgeVariant(user?.role)

	return (
		<Card aria-labelledby="user-profile-name">
			<CardContent className="flex items-center gap-4 p-4">
				<Avatar className="h-12 w-12 md:h-16 md:w-16">
					<AvatarFallback className="text-lg md:text-xl">
						{initial}
					</AvatarFallback>
				</Avatar>
				<div className="flex-1 min-w-0">
					<h2
						id="user-profile-name"
						className="text-lg md:text-xl font-semibold text-foreground truncate"
					>
						{displayName}
					</h2>
					{roleLabel && (
						<Badge variant={badgeVariant} className="mt-1">
							{roleLabel}
						</Badge>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
