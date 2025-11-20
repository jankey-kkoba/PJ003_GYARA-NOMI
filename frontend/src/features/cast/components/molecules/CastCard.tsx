'use client'

import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { CastListItem } from '@/features/cast/types'

/**
 * キャストカードのプロパティ
 */
type CastCardProps = {
  cast: CastListItem
}

/**
 * キャストカードコンポーネント
 * 画像を大きく表示するデザイン
 */
export function CastCard({ cast }: CastCardProps) {
  return (
    <Link href={`/casts/${cast.id}`} className="block">
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        {/* 画像エリア（今後実装予定） */}
        <div className="aspect-[3/4] bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">画像未設定</span>
        </div>

        {/* カード情報 */}
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{cast.name}</CardTitle>
          <CardDescription>
            {cast.age}歳 {cast.areaName && `| ${cast.areaName}`}
          </CardDescription>
        </CardHeader>

        {/* 自己紹介（2行まで表示） */}
        {cast.bio && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {cast.bio}
            </p>
          </CardContent>
        )}

        {/* ランク表示 */}
        <CardContent className="pt-0">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">ランク:</span>
            <span className="text-sm font-semibold">{cast.rank}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
