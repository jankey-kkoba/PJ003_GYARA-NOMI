'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Filter, X } from 'lucide-react'

/**
 * キャストフィルター条件
 */
export type CastFilterValues = {
  minAge?: number
  maxAge?: number
}

type CastFilterDialogProps = {
  /** 現在のフィルター値 */
  values: CastFilterValues
  /** フィルター適用時のコールバック */
  onApply: (values: CastFilterValues) => void
}

/**
 * キャスト検索フィルターダイアログ
 * 年齢での絞り込みを行う
 */
export function CastFilterDialog({ values, onApply }: CastFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [minAge, setMinAge] = useState<string>(values.minAge?.toString() ?? '')
  const [maxAge, setMaxAge] = useState<string>(values.maxAge?.toString() ?? '')

  const handleApply = () => {
    onApply({
      minAge: minAge ? Number(minAge) : undefined,
      maxAge: maxAge ? Number(maxAge) : undefined,
    })
    setOpen(false)
  }

  const handleReset = () => {
    setMinAge('')
    setMaxAge('')
    onApply({})
    setOpen(false)
  }

  // フィルターが適用されているかどうか
  const hasActiveFilter = values.minAge !== undefined || values.maxAge !== undefined

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          絞り込み
          {hasActiveFilter && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              1
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>絞り込み</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 年齢フィルター */}
          <div className="space-y-2">
            <Label>年齢</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="18"
                min={18}
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                className="w-24"
              />
              <span className="text-muted-foreground">〜</span>
              <Input
                type="number"
                placeholder="99"
                min={18}
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                className="w-24"
              />
              <span className="text-muted-foreground">歳</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <Button variant="ghost" onClick={handleReset} className="gap-2">
            <X className="h-4 w-4" />
            リセット
          </Button>
          <Button onClick={handleApply}>適用</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
