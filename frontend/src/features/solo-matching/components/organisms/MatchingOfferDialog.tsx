'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MatchingOfferForm } from './MatchingOfferForm'
import { useToast } from '@/hooks/useToast'

/**
 * MatchingOfferDialogのProps
 */
type MatchingOfferDialogProps = {
  /** キャストID */
  castId: string
  /** キャスト名（表示用） */
  castName?: string
}

/**
 * マッチングオファー送信ダイアログ
 */
export function MatchingOfferDialog({ castId, castName = 'キャスト' }: MatchingOfferDialogProps) {
  const [open, setOpen] = useState(false)
  const { showToast } = useToast()

  const handleSuccess = () => {
    showToast('マッチングオファーを送信しました', 'success')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          マッチングオファーを送る
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{castName}へのマッチングオファー</DialogTitle>
          <DialogDescription>
            希望日時、時間、場所、時給を入力してオファーを送信してください。
          </DialogDescription>
        </DialogHeader>
        <MatchingOfferForm castId={castId} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
