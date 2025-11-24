'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useUserProfile } from '@/features/user/hooks/useUserProfile'
import { useOwnCastProfile } from '@/features/cast/hooks/useCastProfile'
import { CastProfilePhotoManager } from '@/features/cast-profile-photo/components/organisms/CastProfilePhotoManager'
import { BasicInfoForm } from '@/features/user-profile/components/organisms/BasicInfoForm'
import { CastInfoForm } from '@/features/cast-profile/components/organisms/CastInfoForm'
import { PageLoading } from '@/components/molecules/PageLoading'

/**
 * 共通プロフィール編集画面テンプレート
 * キャストとゲストで共通のプロフィール編集ページ
 * ロールに応じて表示するセクションを切り替える
 */
export function ProfileEditTemplate() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: userProfile, isLoading: userProfileLoading } = useUserProfile()
  const { data: castProfile, isLoading: castProfileLoading } = useOwnCastProfile()

  const isCast = user?.role === 'cast'

  // ローディング中
  if (authLoading || userProfileLoading || (isCast && castProfileLoading)) {
    return <PageLoading />
  }

  // 未認証の場合
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">ログインが必要です</p>
        <Button onClick={() => router.push('/login')}>ログインページへ</Button>
      </div>
    )
  }

  // プロフィールが取得できない場合
  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">プロフィールが見つかりません</p>
        <Button onClick={() => router.push('/')}>ホームに戻る</Button>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      {/* ヘッダー */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← 戻る
        </Button>
        <h1 className="text-3xl font-bold">プロフィール編集</h1>
        <p className="text-muted-foreground mt-2">
          プロフィール情報を管理できます
        </p>
      </div>

      <div className="space-y-6">
        {/* 基本情報セクション - 全ユーザー共通 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>
              名前と生年月日を編集します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BasicInfoForm
              defaultName={userProfile.name}
              defaultBirthDate={userProfile.birthDate}
            />
          </CardContent>
        </Card>

        {/* キャスト専用セクション */}
        {isCast && (
          <>
            {/* 写真管理セクション */}
            <Card>
              <CardHeader>
                <CardTitle>プロフィール写真</CardTitle>
                <CardDescription>
                  プロフィール写真を追加・管理します。最低1枚は登録してください。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CastProfilePhotoManager castId={user.id} />
              </CardContent>
            </Card>

            {/* キャスト情報セクション */}
            <Card>
              <CardHeader>
                <CardTitle>キャスト情報</CardTitle>
                <CardDescription>
                  自己紹介などのキャスト専用情報を編集します
                </CardDescription>
              </CardHeader>
              <CardContent>
                {castProfile ? (
                  <CastInfoForm
                    defaultBio={castProfile.bio}
                    defaultAreaId={castProfile.areaId}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    キャスト情報の取得に失敗しました
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
