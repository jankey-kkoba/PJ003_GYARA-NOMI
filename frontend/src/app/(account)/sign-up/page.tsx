import { redirect } from 'next/navigation'
import { SignUpTemplate } from '@/features/auth/components/templates/SignUpTemplate'

/**
 * サインアップページのProps
 */
type SignUpPageProps = {
	searchParams: Promise<{ type?: string }>
}

/**
 * サインアップページ
 * URLパラメータ ?type=guest または ?type=cast でユーザータイプを判別
 */
export default async function SignUpPage({ searchParams }: SignUpPageProps) {
	const params = await searchParams
	const { type } = params

	// typeが不正な場合はログインページにリダイレクト
	if (!type || (type !== 'guest' && type !== 'cast')) {
		redirect('/login')
	}

	return <SignUpTemplate userType={type} />
}
