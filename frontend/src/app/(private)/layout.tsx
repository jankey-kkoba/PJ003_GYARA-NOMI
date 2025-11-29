import { redirect } from 'next/navigation'
import { auth } from '@/libs/auth'
import { userService } from '@/features/user/services/userService'

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
		redirect('/login')
	}

	// プロフィール未登録の場合は登録ページへ
	const hasProfile = await userService.hasProfile(session.user.id)
	if (!hasProfile) {
		// ユーザーのroleに基づいてtypeを決定
		const user = await userService.findUserById(session.user.id)
		const userType = user?.role || 'guest'
		redirect(`/profile/create?type=${userType}`)
	}

	return <>{children}</>
}
