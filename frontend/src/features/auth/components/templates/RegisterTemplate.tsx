'use client'

import { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useRegisterUser } from '@/features/user/hooks/useRegisterUser'
import { useToast } from '@/hooks/useToast'

/**
 * ユーザータイプ
 */
type UserType = 'guest' | 'cast'

/**
 * RegisterTemplateのProps
 */
type RegisterTemplateProps = {
  userType: UserType
}

/**
 * ユーザータイプに応じた表示設定
 */
const userTypeConfig = {
  guest: {
    title: 'ゲストプロフィール登録',
    description: 'ゲストとしてプロフィール情報を入力してください',
  },
  cast: {
    title: 'キャストプロフィール登録',
    description: 'キャストとしてプロフィール情報を入力してください',
  },
}

/**
 * プロフィール登録ページのテンプレート
 * LINE認証後に表示されるプロフィール入力フォーム
 */
export function RegisterTemplate({ userType }: RegisterTemplateProps) {
  const config = userTypeConfig[userType]
  const router = useRouter()
  const { showToast } = useToast()
  const { mutate, isPending } = useRegisterUser()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const birthDate = formData.get('birthDate') as string

    mutate(
      {
        name,
        birthDate,
        userType,
      },
      {
        onSuccess: () => {
          showToast('プロフィール登録が完了しました。', 'success')
          router.push('/')
        },
        onError: (error) => {
          showToast(`登録に失敗しました: ${error.message}`, 'error')
        },
      }
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-md space-y-6">
        {/* ヘッダー */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {config.description}
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="name">お名前</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="山田太郎"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">生年月日</Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending ? '登録中...' : '登録する'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          入力した情報は後から変更できます
        </p>
      </div>
    </div>
  )
}
