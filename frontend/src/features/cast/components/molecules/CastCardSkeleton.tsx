import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * キャストカードのスケルトンコンポーネント
 * CastCardコンポーネントのローディング状態を表現
 */
export function CastCardSkeleton() {
  return (
    <Card className="overflow-hidden gap-1 py-0 md:gap-6 md:py-6">
      {/* 画像エリア */}
      <Skeleton className="aspect-square" />

      {/* カード情報 */}
      <CardHeader className="p-2 pb-1 space-y-0.5 md:p-6 md:pb-3 md:space-y-2">
        {/* 名前 */}
        <Skeleton className="h-4 w-3/4 md:h-6" />
        {/* 年齢 */}
        <Skeleton className="h-3 w-1/3 md:h-4" />
      </CardHeader>

      {/* 自己紹介 */}
      <CardContent className="p-2 pt-0 pb-2 md:p-6 md:pt-0">
        <Skeleton className="h-3 w-full md:h-4" />
        <Skeleton className="h-3 w-5/6 mt-1 md:h-4" />
      </CardContent>
    </Card>
  )
}

type CastCardSkeletonListProps = {
  /** 表示するスケルトンの数 */
  count?: number
}

/**
 * キャストカード一覧用のスケルトンコンポーネント
 * グリッド表示に対応
 */
export function CastCardSkeletonList({ count = 6 }: CastCardSkeletonListProps) {
  return (
    <div data-testid="cast-card-skeleton-list">
      {Array.from({ length: count }).map((_, index) => (
        <CastCardSkeleton key={index} />
      ))}
    </div>
  )
}
