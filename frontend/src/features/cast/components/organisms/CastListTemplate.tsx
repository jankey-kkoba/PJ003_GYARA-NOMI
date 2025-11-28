'use client'

import { useState } from 'react'
import { useCastList } from '@/features/cast/hooks/useCastList'
import { CastCard } from '@/features/cast/components/molecules/CastCard'
import { Pagination } from '@/components/molecules/Pagination'
import {
	CastFilterDialog,
	type CastFilterValues,
} from '@/features/cast/components/molecules/CastFilterDialog'
import { CASTS_PER_PAGE } from '@/features/cast/constants'
import { CastCardSkeletonList } from '@/features/cast/components/molecules/CastCardSkeleton'

/**
 * キャスト一覧テンプレートコンポーネント
 * キャスト一覧の表示とページネーション・フィルタリングを管理
 */
export function CastListTemplate() {
	const [page, setPage] = useState(1)
	const [filter, setFilter] = useState<CastFilterValues>({})

	const handleFilterApply = (values: CastFilterValues) => {
		setFilter(values)
		setPage(1) // フィルター変更時はページを1にリセット
	}

	const { data, isLoading, error } = useCastList({
		page,
		limit: CASTS_PER_PAGE,
		minAge: filter.minAge,
		maxAge: filter.maxAge,
	})

	if (isLoading) {
		return (
			<div className="space-y-6">
				{/* フィルターボタン */}
				<div className="flex justify-end">
					<CastFilterDialog values={filter} onApply={handleFilterApply} />
				</div>

				{/* キャスト一覧スケルトン */}
				<div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
					<CastCardSkeletonList count={CASTS_PER_PAGE} />
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<p className="text-destructive">
					エラーが発生しました: {error.message}
				</p>
			</div>
		)
	}

	if (!data || data.casts.length === 0) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<p className="text-muted-foreground">キャストが見つかりませんでした</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* フィルターボタン */}
			<div className="flex justify-end">
				<CastFilterDialog values={filter} onApply={handleFilterApply} />
			</div>

			{/* キャスト一覧グリッド */}
			<div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
				{data.casts.map((cast) => (
					<CastCard key={cast.id} cast={cast} />
				))}
			</div>

			{/* ページネーション */}
			<Pagination
				currentPage={page}
				totalPages={data.totalPages}
				onPageChange={setPage}
			/>
		</div>
	)
}
