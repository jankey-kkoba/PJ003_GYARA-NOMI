import { redirect } from 'next/navigation'
import { auth } from '@/libs/auth'
import { ROUTES } from '@/libs/constants/routes'
import { userService } from '@/features/user/services/userService'
import { BottomNavigation } from '@/components/organisms/BottomNavigation'

/**
 * プライベートルートのレイアウト
 * ログイン済みかつプロフィール登録済みのユーザーのみアクセス可能
 */
export default async function PrivateLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const session = await auth()

	// 未ログインの場合はログインページへ
	if (!session?.user?.id) {
		redirect(ROUTES.LOGIN)
	}

	// プロフィール未登録の場合は登録ページへ
	const hasProfile = await userService.hasProfile(session.user.id)
	if (!hasProfile) {
		// ユーザーのroleに基づいてtypeを決定
		const user = await userService.findUserById(session.user.id)
		const userType = user?.role || 'guest'
		redirect(`${ROUTES.PROFILE.CREATE}?type=${userType}`)
	}

	return (
		<>
			<main className="pb-16">{children}</main>
			<BottomNavigation />
		</>
	)
}
