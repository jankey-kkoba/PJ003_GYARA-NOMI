'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, User } from 'lucide-react'

import { cn } from '@/libs/utils'
import { ROUTES } from '@/libs/constants/routes'
import { useAuth } from '@/features/auth/hooks/useAuth'

/**
 * ユーザーロールの型
 */
type UserRole = 'guest' | 'cast' | 'admin'

/**
 * ナビゲーションアイテムの型定義
 */
type NavItem = {
	/** 表示ラベル */
	label: string
	/** 遷移先パス */
	href: string
	/** アイコンコンポーネント */
	icon: React.ComponentType<{ className?: string }>
	/** 表示対象のロール（未指定の場合は全ロール） */
	roles?: UserRole[]
}

/**
 * ナビゲーションアイテムの定義
 */
const NAV_ITEMS: NavItem[] = [
	{
		label: 'ホーム',
		href: ROUTES.HOME,
		icon: Home,
	},
	{
		label: '探す',
		href: ROUTES.CASTS.LIST,
		icon: Users,
		roles: ['guest'],
	},
	{
		label: 'プロフィール',
		href: ROUTES.PROFILE.EDIT,
		icon: User,
	},
]

/**
 * ボトムナビゲーションコンポーネント
 * モバイルファーストのグローバルナビゲーション
 */
export function BottomNavigation() {
	const pathname = usePathname()
	const { user } = useAuth()
	const userRole = user?.role

	// ユーザーのロールに応じてフィルタリング
	const filteredItems = NAV_ITEMS.filter((item) => {
		if (!item.roles) return true
		if (!userRole) return false
		return item.roles.includes(userRole)
	})

	return (
		<nav
			className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background"
			role="navigation"
			aria-label="メインナビゲーション"
		>
			<ul className="flex h-16 items-center justify-around">
				{filteredItems.map((item) => {
					const isActive = pathname === item.href
					const Icon = item.icon

					return (
						<li key={item.href} className="flex-1">
							<Link
								href={item.href}
								className={cn(
									'flex flex-col items-center justify-center gap-1 py-2 text-xs transition-colors',
									isActive
										? 'text-primary'
										: 'text-muted-foreground hover:text-foreground',
								)}
								aria-current={isActive ? 'page' : undefined}
							>
								<Icon className="h-5 w-5" />
								<span>{item.label}</span>
							</Link>
						</li>
					)
				})}
			</ul>
		</nav>
	)
}
