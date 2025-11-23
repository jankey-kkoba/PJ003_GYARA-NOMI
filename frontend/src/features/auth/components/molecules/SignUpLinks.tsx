import Link from 'next/link'

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
          href="/sign-up?type=guest"
          className="text-sm font-medium text-primary hover:underline"
        >
          ゲストとして登録
        </Link>
        <Link
          href="/sign-up?type=cast"
          className="text-sm font-medium text-primary hover:underline"
        >
          キャストとして登録
        </Link>
      </div>
    </div>
  )
}
