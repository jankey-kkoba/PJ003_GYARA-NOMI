import { RegisterTemplate } from '@/features/auth/components/templates/RegisterTemplate'
import { UserTypeSelectTemplate } from '@/features/auth/components/templates/UserTypeSelectTemplate'

/**
 * 会員登録ページのProps
 */
type RegisterPageProps = {
  searchParams: Promise<{ type?: string; provider?: string; providerAccountId?: string }>
}

/**
 * 会員登録ページ
 * URLパラメータ ?type=guest または ?type=cast でユーザータイプを判別
 * typeが指定されていない場合はタイプ選択画面を表示
 */
export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams
  const { type, provider, providerAccountId } = params

  // typeが指定されていない場合はタイプ選択画面を表示
  if (!type || (type !== 'guest' && type !== 'cast')) {
    // provider情報を引き継ぐためのクエリパラメータを構築
    const queryParams = new URLSearchParams()
    if (provider) queryParams.set('provider', provider)
    if (providerAccountId) queryParams.set('providerAccountId', providerAccountId)

    return <UserTypeSelectTemplate queryParams={queryParams.toString()} />
  }

  return <RegisterTemplate userType={type} />
}
