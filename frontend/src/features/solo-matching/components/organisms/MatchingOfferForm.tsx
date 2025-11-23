'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateSoloMatching } from '@/features/solo-matching/hooks/useCreateSoloMatching'
import {
  createSoloMatchingSchema,
  type CreateSoloMatchingInput,
} from '@/features/solo-matching/schemas/createSoloMatching'
import { useMemo, useState } from 'react'

/**
 * MatchingOfferFormのProps
 */
type MatchingOfferFormProps = {
  /** キャストID */
  castId: string
  /** 送信成功時のコールバック */
  onSuccess?: () => void
}

/**
 * 開始時刻の指定方法
 */
const timeOptions = [
  { value: '30min', label: '30分後', minutes: 30 },
  { value: '1hour', label: '1時間後', minutes: 60 },
  { value: '2hours', label: '2時間後', minutes: 120 },
  { value: '3hours', label: '3時間後', minutes: 180 },
  { value: '6hours', label: '6時間後', minutes: 360 },
  { value: 'custom', label: 'その他（カスタム日時）', minutes: null },
]

/**
 * 時間選択肢（30分刻み、30分〜8時間）
 */
const durationOptions = [
  { value: 30, label: '30分' },
  { value: 60, label: '1時間' },
  { value: 90, label: '1時間30分' },
  { value: 120, label: '2時間' },
  { value: 150, label: '2時間30分' },
  { value: 180, label: '3時間' },
  { value: 210, label: '3時間30分' },
  { value: 240, label: '4時間' },
  { value: 270, label: '4時間30分' },
  { value: 300, label: '5時間' },
  { value: 330, label: '5時間30分' },
  { value: 360, label: '6時間' },
  { value: 390, label: '6時間30分' },
  { value: 420, label: '7時間' },
  { value: 450, label: '7時間30分' },
  { value: 480, label: '8時間' },
]

/**
 * マッチングオファー送信フォーム
 */
export function MatchingOfferForm({ castId, onSuccess }: MatchingOfferFormProps) {
  const { mutate, isPending } = useCreateSoloMatching()
  const [timeSelectMode, setTimeSelectMode] = useState<string>('1hour') // デフォルト1時間後

  const form = useForm<CreateSoloMatchingInput>({
    resolver: zodResolver(createSoloMatchingSchema),
    defaultValues: {
      castId,
      proposedDate: '',
      proposedDuration: 120, // デフォルト2時間
      proposedLocation: '',
      hourlyRate: 3000, // デフォルト3000ポイント/時間
    },
  })

  // 時間選択モード変更のハンドラ
  const handleTimeSelectModeChange = (value: string) => {
    setTimeSelectMode(value)

    // カスタムモード以外の場合は、proposedDateを自動計算
    if (value !== 'custom') {
      const selectedOption = timeOptions.find((opt) => opt.value === value)
      if (selectedOption && selectedOption.minutes !== null) {
        const now = new Date()
        const proposedDate = new Date(now.getTime() + selectedOption.minutes * 60 * 1000)
        // ISO8601形式に変換
        form.setValue('proposedDate', proposedDate.toISOString())
      }
    }
  }

  // 合計ポイントを計算
  const proposedDuration = useWatch({ control: form.control, name: 'proposedDuration' })
  const hourlyRate = useWatch({ control: form.control, name: 'hourlyRate' })
  const totalPoints = useMemo(() => {
    return Math.round((proposedDuration / 60) * hourlyRate)
  }, [proposedDuration, hourlyRate])

  const onSubmit = (data: CreateSoloMatchingInput) => {
    mutate(data, {
      onSuccess: () => {
        form.reset()
        setTimeSelectMode('1hour')
        onSuccess?.()
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* 開始時刻選択モード */}
        <div className="space-y-2">
          <FormLabel>希望開始時刻</FormLabel>
          <Select value={timeSelectMode} onValueChange={handleTimeSelectModeChange}>
            <SelectTrigger>
              <SelectValue placeholder="開始時刻を選択" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* カスタム日時入力（「その他」選択時のみ表示） */}
        {timeSelectMode === 'custom' && (
          <FormField
            control={form.control}
            name="proposedDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>カスタム日時</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormDescription>希望の日時を直接指定してください</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* 時間 */}
        <FormField
          control={form.control}
          name="proposedDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>希望時間</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                defaultValue={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="時間を選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 場所 */}
        <FormField
          control={form.control}
          name="proposedLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>希望場所</FormLabel>
              <FormControl>
                <Input placeholder="例：渋谷駅周辺" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 時給 */}
        <FormField
          control={form.control}
          name="hourlyRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>時給（ポイント）</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1000}
                  step={100}
                  placeholder="3000"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>最低1000ポイント</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 合計ポイント表示 */}
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium">合計ポイント</p>
          <p className="text-2xl font-bold">{totalPoints.toLocaleString()}ポイント</p>
        </div>

        {/* 送信ボタン */}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? '送信中...' : 'オファーを送信'}
        </Button>
      </form>
    </Form>
  )
}
