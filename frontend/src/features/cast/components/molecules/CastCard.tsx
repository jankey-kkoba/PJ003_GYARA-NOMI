'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { CastListItem } from '@/features/cast/types'
import { FavoriteButton } from '@/features/favorite/components/atoms/FavoriteButton'

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
    <Link
      href={`/casts/${cast.id}`}
      className="block"
      aria-label={`${cast.name}のプロフィール`}
    >
      <Card className="overflow-hidden transition-shadow hover:shadow-lg gap-1 py-0 md:gap-6 md:py-6">
        {/* 画像エリア */}
        <div className="aspect-square bg-muted flex items-center justify-center relative">
          {cast.thumbnailUrl ? (
            <Image
              src={cast.thumbnailUrl}
              alt={`${cast.name}のプロフィール写真`}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="text-muted-foreground text-xs">画像未設定</span>
          )}
          <FavoriteButton
            castId={cast.id}
            className="absolute top-1 right-1 md:top-2 md:right-2"
          />
        </div>

        {/* カード情報 */}
        <CardHeader className="p-2 pb-1 space-y-0.5 md:p-6 md:pb-3 md:space-y-2">
          <CardTitle className="text-sm md:text-lg truncate">
            {cast.name.length > 7 ? `${cast.name.slice(0, 7)}...` : cast.name}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {cast.age}歳
          </CardDescription>
</CardHeader>        {/* 自己紹介（2行まで表示） */}
        {cast.bio && (
          <CardContent className="p-2 pt-0 pb-2 md:p-6 md:pt-0">
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
              {cast.bio}
            </p>
          </CardContent>
        )}
      </Card>
    </Link>
  )
}
