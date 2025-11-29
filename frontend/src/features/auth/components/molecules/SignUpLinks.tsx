import Link from 'next/link'
import { ROUTES } from '@/libs/constants/routes'

/**
 * サインアップリンクコンポーネント
 * ゲストとキャストの登録リンクを表示
 */
export function SignUpLinks() {
	return (
		<div className="text-center">
			<p className="text-sm text-muted-foreground">
				アカウントをお持ちでない方は
			</p>
			<div className="mt-2 flex justify-center gap-4">
				<Link
					href={`${ROUTES.SIGN_UP}?type=guest`}
					className="text-sm font-medium text-primary hover:underline"
				>
					ゲストとして登録
				</Link>
				<Link
					href={`${ROUTES.SIGN_UP}?type=cast`}
					className="text-sm font-medium text-primary hover:underline"
				>
					キャストとして登録
				</Link>
			</div>
		</div>
	)
}
