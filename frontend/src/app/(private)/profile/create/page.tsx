import { redirect } from 'next/navigation'
import { RegisterTemplate } from '@/features/auth/components/templates/RegisterTemplate'

/**
 * プロフィール作成ページのProps
 */
type CreateProfilePageProps = {
	searchParams: Promise<{ type?: string }>
}

/**
 * プロフィール作成ページ
 * URLパラメータ ?type=guest または ?type=cast でユーザータイプを判別
 */
export default async function CreateProfilePage({
	searchParams,
}: CreateProfilePageProps) {
	const params = await searchParams
	const { type } = params

	// typeが不正な場合はログインページにリダイレクト
	if (!type || (type !== 'guest' && type !== 'cast')) {
		redirect('/login')
	}

	return <RegisterTemplate userType={type} />
}
