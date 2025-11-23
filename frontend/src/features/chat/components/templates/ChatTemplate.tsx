'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MatchingOfferDialog } from '@/features/solo-matching/components/organisms/MatchingOfferDialog'

type ChatTemplateProps = {
  castId: string
  castName?: string
}

/**
 * チャットページのテンプレートコンポーネント
 * 最低限のUI実装（メッセージ機能は未実装）
 */
export function ChatTemplate({ castId, castName = 'キャスト' }: ChatTemplateProps) {
  return (
    <div className="flex h-screen flex-col">
      {/* ヘッダー */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardHeader>
          <CardTitle>{castName}とのチャット</CardTitle>
        </CardHeader>
      </Card>

      {/* メッセージエリア（空） */}
      <div className="flex flex-1 items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">メッセージはまだありません</p>
      </div>

      {/* 下部：マッチングオファー送信ボタン */}
      <Card className="rounded-none border-x-0 border-b-0">
        <CardContent className="pt-6">
          <MatchingOfferDialog castId={castId} castName={castName} />
        </CardContent>
      </Card>
    </div>
  )
}
