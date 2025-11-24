'use client'

import { useGuestSoloMatchings } from '@/features/solo-matching/hooks/useGuestSoloMatchings'
import { MatchingStatusCard } from '@/features/solo-matching/components/molecules/MatchingStatusCard'
import { SectionLoading } from '@/components/molecules/SectionLoading'

/**
 * マッチング状況一覧
 * ゲストのマッチング一覧を表示
 */
export function MatchingStatusList() {
  const { data: matchings, isLoading, isError, error } = useGuestSoloMatchings()

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
