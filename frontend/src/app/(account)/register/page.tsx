import { redirect } from 'next/navigation'
import { RegisterTemplate } from '@/features/auth/components/templates/RegisterTemplate'

/**
 * プロフィール登録ページのProps
 */
type RegisterPageProps = {
  searchParams: Promise<{ type?: string }>
}

/**
 * プロフィール登録ページ
 * URLパラメータ ?type=guest または ?type=cast でユーザータイプを判別
 */
export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams
  const { type } = params

  // typeが不正な場合はログインページにリダイレクト
  if (!type || (type !== 'guest' && type !== 'cast')) {
    redirect('/login')
  }

  return <RegisterTemplate userType={type} />
}
