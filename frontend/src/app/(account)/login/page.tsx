import { LoginTemplate } from '@/features/auth/components/templates/LoginTemplate'
import { DevelopLogin } from '@/features/auth/components/organisms/DevelopLogin'
import { APP_ENV } from '@/libs/constants/env'

/**
 * ログインページ
 */
export default function LoginPage() {
	return (
		<LoginTemplate>
			{/* 開発環境用ログインフォーム */}
			{APP_ENV === 'development' && <DevelopLogin />}
		</LoginTemplate>
	)
}
