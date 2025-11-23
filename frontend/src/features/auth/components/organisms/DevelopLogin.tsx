import { CredentialsLoginForm } from '@/features/auth/components/atoms/CredentialsLoginForm'

/**
 * 開発環境用ログインコンポーネント
 * E2Eテスト・手元確認用
 */
export function DevelopLogin() {
  return (
    <CredentialsLoginForm
      title="開発環境用ログイン"
      description="E2Eテスト・手元確認用(本番では表示されません)"
      showDevHelpText={true}
      variant="dev"
    />
  )
}
