import { redirect } from 'next/navigation'
import { auth } from '@/libs/auth'
import { ROUTES } from '@/libs/constants/routes'
import { userService } from '@/features/user/services/userService'
import { CastListTemplate } from '@/features/cast/components/organisms/CastListTemplate'

/**
 * キャスト一覧ページ
 * ゲストユーザーのみアクセス可能
 */
export default async function CastsPage() {
	const session = await auth()

	// 認証チェック（privateレイアウトで実施済みだが念のため）
	if (!session?.user?.id) {
		redirect(ROUTES.LOGIN)
	}

	// ユーザー情報を取得
	const user = await userService.findUserById(session.user.id)

	// ゲストユーザーのみアクセス可能
	if (user?.role !== 'guest') {
		redirect(ROUTES.HOME)
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-8">キャスト一覧</h1>
			<CastListTemplate />
		</div>
	)
}
