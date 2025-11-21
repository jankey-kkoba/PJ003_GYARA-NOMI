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
import { useCastDetail } from '@/features/cast/hooks/useCastDetail'
import { FavoriteButton } from '@/features/favorite/components/atoms/FavoriteButton'

type CastDetailTemplateProps = {
  castId: string
}

/**
 * キャスト詳細画面テンプレート
 */
export function CastDetailTemplate({ castId }: CastDetailTemplateProps) {
  const router = useRouter()
  const { data: cast, isLoading, error } = useCastDetail(castId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  if (error || !cast) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">
          {error?.message || 'キャストが見つかりません'}
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          戻る
        </Button>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      {/* 戻るボタン */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        ← 一覧に戻る
      </Button>

      <Card>
        {/* 画像エリア（今後実装予定） */}
        <div className="aspect-video bg-muted flex items-center justify-center relative">
          <span className="text-muted-foreground">画像未設定</span>
          <FavoriteButton
            castId={castId}
            className="absolute top-2 right-2"
          />
        </div>

        <CardHeader>
          <CardTitle className="text-2xl">{cast.name}</CardTitle>
          <CardDescription className="text-lg">
            {cast.age}歳 {cast.areaName && `・ ${cast.areaName}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 自己紹介 */}
          {cast.bio && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                自己紹介
              </h3>
              <p className="whitespace-pre-wrap">{cast.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
