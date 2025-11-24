import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SoloMatching, MatchingStatus } from '@/features/solo-matching/types/soloMatching'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

/**
 * マッチングステータスのラベルと色を取得
 */
function getStatusInfo(status: MatchingStatus): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  switch (status) {
    case 'pending':
      return { label: '回答待ち', variant: 'default' }
    case 'accepted':
      return { label: '成立', variant: 'default' }
    case 'rejected':
      return { label: '不成立', variant: 'destructive' }
    case 'cancelled':
      return { label: 'キャンセル', variant: 'destructive' }
    default:
      return { label: status, variant: 'outline' }
  }
}

type MatchingStatusCardProps = {
  matching: SoloMatching
}

/**
 * マッチング状況カード
 * 個々のマッチング情報を表示
 */
export function MatchingStatusCard({ matching }: MatchingStatusCardProps) {
  const statusInfo = getStatusInfo(matching.status)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">マッチングID: {matching.id.slice(0, 8)}</CardTitle>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">希望日時:</span>
          </div>
          <div className="text-right">
            {format(new Date(matching.proposedDate), 'M月d日(E) HH:mm', { locale: ja })}
          </div>

          <div>
            <span className="text-muted-foreground">時間:</span>
          </div>
          <div className="text-right">
            {matching.proposedDuration}分
          </div>

          <div>
            <span className="text-muted-foreground">場所:</span>
          </div>
          <div className="text-right truncate">
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
    </Card>
  )
}
