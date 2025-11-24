'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useUpdateCastProfile } from '@/features/cast/hooks/useCastProfile'

type CastInfoFormProps = {
  /** 現在の自己紹介 */
  defaultBio?: string | null
  /** 現在のエリアID（将来の機能拡張用） */
  defaultAreaId?: string | null
}

/**
 * キャスト専用情報編集フォーム（自己紹介、エリア）
 */
export function CastInfoForm({ defaultBio }: CastInfoFormProps) {
  const [bio, setBio] = useState(defaultBio || '')
  // エリア機能は将来実装予定のためコメントアウト
  // const [areaId, setAreaId] = useState(defaultAreaId || '')
  const updateMutation = useUpdateCastProfile()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateMutation.mutateAsync({
        bio: bio || null,
        areaId: null, // 将来実装予定
      })
      alert('キャスト情報を更新しました')
    } catch {
      // エラーはmutationのonErrorで処理される
    }
  }

  const isChanged = bio !== (defaultBio || '')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bio">自己紹介</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
          placeholder="自己紹介を入力してください"
          maxLength={1000}
          rows={5}
          className="resize-none"
        />
        <p className="text-sm text-muted-foreground">
          {bio.length}/1000 文字
        </p>
      </div>

      {/* エリア選択は今後実装予定のため、コメントアウト
      <div className="space-y-2">
        <Label htmlFor="areaId">活動エリア</Label>
        <Select value={areaId} onValueChange={setAreaId}>
          <SelectTrigger id="areaId">
            <SelectValue placeholder="エリアを選択" />
          </SelectTrigger>
          <SelectContent>
            {/* エリア一覧を取得して表示 *}
          </SelectContent>
        </Select>
      </div>
      */}

      {updateMutation.isError && (
        <p className="text-sm text-destructive">
          {updateMutation.error?.message || '更新に失敗しました'}
        </p>
      )}

      <Button type="submit" disabled={!isChanged || updateMutation.isPending}>
        {updateMutation.isPending ? '更新中...' : '更新する'}
      </Button>
    </form>
  )
}
