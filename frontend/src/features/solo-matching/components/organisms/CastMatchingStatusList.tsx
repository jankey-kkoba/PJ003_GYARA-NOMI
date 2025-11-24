'use client'

import { useCastSoloMatchings } from '@/features/solo-matching/hooks/useCastSoloMatchings'
import { MatchingStatusCard } from '@/features/solo-matching/components/molecules/MatchingStatusCard'
import { SectionLoading } from '@/components/molecules/SectionLoading'

/**
 * キャストのマッチング状況一覧
 * キャストのマッチング一覧を表示
 */
export function CastMatchingStatusList() {
  const { data: matchings, isLoading, isError, error } = useCastSoloMatchings()

  if (isLoading) {
    return <SectionLoading message="マッチング状況を読み込み中..." minHeight="min-h-[200px]" />
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

  if (!matchings || matchings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">マッチングはありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {matchings.map((matching) => (
        <MatchingStatusCard key={matching.id} matching={matching} />
      ))}
    </div>
  )
}
