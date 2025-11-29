'use client'

import { useCompletedSoloMatchings } from '@/features/solo-matching/hooks/useCompletedSoloMatchings'
import { SectionLoading } from '@/components/molecules/SectionLoading'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CastReviewDialog } from '@/features/cast-review/components/organisms/CastReviewDialog'

/**
 * 完了済みマッチング一覧
 * ゲストの完了済みマッチング一覧を表示（評価機能付き）
 */
export function CompletedMatchingList() {
	const {
		data: matchings,
		isLoading,
		isError,
		error,
	} = useCompletedSoloMatchings()

	if (isLoading) {
		return (
			<SectionLoading
				message="完了済みマッチングを読み込み中..."
				minHeight="min-h-[200px]"
			/>
		)
	}

	if (isError) {
		return (
			<div className="flex min-h-[200px] items-center justify-center">
				<p className="text-destructive">
					{error instanceof Error ? error.message : 'エラーが発生しました'}
				</p>
			</div>
		)
	}

	if (!matchings || matchings.length === 0) {
		return (
			<div className="flex min-h-[200px] items-center justify-center">
				<p className="text-muted-foreground">
					完了済みのマッチングはありません
				</p>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{matchings.map((matching) => (
				<Card key={matching.id}>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-base">
								マッチングID: {matching.id.slice(0, 8)}
							</CardTitle>
							<Badge variant="secondary">完了</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="grid grid-cols-2 gap-2 text-sm">
							<div>
								<span className="text-muted-foreground">終了日時:</span>
							</div>
							<div className="text-right">
								{matching.actualEndAt
									? format(new Date(matching.actualEndAt), 'M月d日(E) HH:mm', {
											locale: ja,
										})
									: '-'}
							</div>

							<div>
								<span className="text-muted-foreground">場所:</span>
							</div>
							<div className="truncate text-right">
								{matching.proposedLocation}
							</div>

							<div>
								<span className="text-muted-foreground">合計:</span>
							</div>
							<div className="text-right font-semibold">
								{matching.totalPoints.toLocaleString()}ポイント
							</div>
						</div>
					</CardContent>
					<CardFooter>
						<CastReviewDialog matchingId={matching.id} />
					</CardFooter>
				</Card>
			))}
		</div>
	)
}
