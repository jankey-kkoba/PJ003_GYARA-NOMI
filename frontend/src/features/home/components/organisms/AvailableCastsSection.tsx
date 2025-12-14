'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CastCard } from '@/features/cast/components/molecules/CastCard'
import { CastCardSkeleton } from '@/features/cast/components/molecules/CastCardSkeleton'
import { useCastList } from '@/features/cast/hooks/useCastList'
import { ROUTES } from '@/libs/constants/routes'

/**
 * ホーム画面に表示するキャストの数
 */
const HOME_CAST_DISPLAY_COUNT = 4

/**
 * ホーム画面のキャスト一覧セクション
 * 本日予定が空いているキャストを表示する
 */
export function AvailableCastsSection() {
	const { data, isLoading, isError } = useCastList({
		limit: HOME_CAST_DISPLAY_COUNT,
	})

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2 md:pb-4">
				<CardTitle className="text-base md:text-lg">キャスト一覧</CardTitle>
				<Button variant="ghost" size="sm" asChild>
					<Link href={ROUTES.CASTS.LIST}>もっと見る</Link>
				</Button>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div
						className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
						role="status"
						aria-live="polite"
						aria-label="キャスト一覧を読み込み中"
					>
						{Array.from({ length: HOME_CAST_DISPLAY_COUNT }).map((_, i) => (
							<CastCardSkeleton key={i} />
						))}
						<span className="sr-only">キャスト一覧を読み込み中...</span>
					</div>
				) : isError ? (
					<div className="flex items-center justify-center min-h-[200px]">
						<p className="text-destructive">キャスト一覧の取得に失敗しました</p>
					</div>
				) : data?.casts && data.casts.length > 0 ? (
					<div
						className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
						role="list"
						aria-label="キャスト一覧"
					>
						{data.casts.map((cast) => (
							<div key={cast.id} role="listitem">
								<CastCard cast={cast} />
							</div>
						))}
					</div>
				) : (
					<div className="flex items-center justify-center min-h-[200px]">
						<p className="text-muted-foreground">
							現在表示できるキャストがいません
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
