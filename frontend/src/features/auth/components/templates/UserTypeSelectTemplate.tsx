'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * UserTypeSelectTemplateのProps
 */
type UserTypeSelectTemplateProps = {
  /** 引き継ぐクエリパラメータ */
  queryParams?: string
}

/**
 * ユーザータイプ選択ページのテンプレート
 * ゲストかキャストかを選択させる
 */
export function UserTypeSelectTemplate({ queryParams }: UserTypeSelectTemplateProps) {
  // クエリパラメータを引き継ぐためのURL生成
  const buildUrl = (type: string) => {
    const params = new URLSearchParams(queryParams)
    params.set('type', type)
    return `/register?${params.toString()}`
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">会員登録</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            登録するアカウントタイプを選択してください
          </p>
        </div>

        {/* 選択カード */}
        <div className="space-y-4">
          {/* ゲスト選択 */}
          <Link href={buildUrl('guest')} className="block">
            <div className="rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-md">
              <h2 className="text-lg font-semibold text-card-foreground">
                ゲストとして登録
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                キャストを探して飲み会を楽しみたい方
              </p>
            </div>
          </Link>

          {/* キャスト選択 */}
          <Link href={buildUrl('cast')} className="block">
            <div className="rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-md">
              <h2 className="text-lg font-semibold text-card-foreground">
                キャストとして登録
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                ゲストと飲み会をして報酬を得たい方
              </p>
            </div>
          </Link>
        </div>

        {/* 戻るリンク */}
        <div className="text-center">
          <Button variant="ghost" asChild>
            <Link href="/login">ログインページに戻る</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
