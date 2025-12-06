'use client'

import { useCastSoloMatchings } from '@/features/solo-matching/hooks/useCastSoloMatchings'
import { useCastGroupMatchings } from '@/features/group-matching/hooks/useCastGroupMatchings'
import { MatchingStatusCard } from '@/features/solo-matching/components/molecules/MatchingStatusCard'
import { CastGroupMatchingStatusCard } from '@/features/group-matching/components/molecules/CastGroupMatchingStatusCard'
import { SectionLoading } from '@/components/molecules/SectionLoading'

/**
 * キャストのマッチング状況一覧
 * キャストのソロマッチングとグループマッチングを統合して表示
 */
export function CastMatchingStatusList() {
	const {
		data: soloMatchings,
		isLoading: isSoloLoading,
		isError: isSoloError,
		error: soloError,
	} = useCastSoloMatchings()

	const {
		data: groupMatchings,
		isLoading: isGroupLoading,
		isError: isGroupError,
		error: groupError,
	} = useCastGroupMatchings()

	const isLoading = isSoloLoading || isGroupLoading
	const isError = isSoloError || isGroupError
	const error = soloError || groupError

	if (isLoading) {
		return (
			<SectionLoading
				message="マッチング状況を読み込み中..."
				minHeight="min-h-[200px]"
			/>
		)
	}

	if (isError) {
		return (
			<div className="flex items-center justify-center min-h-[200px]">
				<p className="text-destructive">
					{error instanceof Error ? error.message : 'エラーが発生しました'}
				</p>
			</div>
		)
	}

	const hasSoloMatchings = soloMatchings && soloMatchings.length > 0
	const hasGroupMatchings = groupMatchings && groupMatchings.length > 0

	if (!hasSoloMatchings && !hasGroupMatchings) {
		return (
			<div className="flex items-center justify-center min-h-[200px]">
				<p className="text-muted-foreground">マッチングはありません</p>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{/* グループマッチング */}
			{groupMatchings?.map((matching) => (
				<CastGroupMatchingStatusCard key={matching.id} matching={matching} />
			))}
			{/* ソロマッチング */}
			{soloMatchings?.map((matching) => (
				<MatchingStatusCard
					key={matching.id}
					matching={matching}
					showActions={true}
				/>
			))}
		</div>
	)
}
