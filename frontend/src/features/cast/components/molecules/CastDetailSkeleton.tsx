import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * キャスト詳細ページのスケルトンコンポーネント
 * CastDetailTemplateコンポーネントのローディング状態を表現
 */
export function CastDetailSkeleton() {
  return (
    <div
      className="container max-w-2xl mx-auto py-6 px-4"
      data-testid="cast-detail-skeleton"
    >
      {/* 戻るボタン */}
      <Skeleton className="h-10 w-32 mb-4" />

      <Card>
        {/* プロフィール情報 */}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* 名前 */}
              <Skeleton className="h-8 w-32 mb-2" />
              {/* 年齢・エリア */}
              <Skeleton className="h-6 w-24" />
            </div>
            {/* お気に入りボタン */}
            <Skeleton className="size-10 rounded-full" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 写真ギャラリーセクション */}
          <div>
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>

          {/* 自己紹介セクション */}
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
