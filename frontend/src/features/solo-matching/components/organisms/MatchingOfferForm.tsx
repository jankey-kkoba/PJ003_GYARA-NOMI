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
import { useCastDetail } from '@/features/cast/hooks/useCastDetail'
import { getHourlyRateByRank, getRankName } from '@/features/cast/constants'
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
 * 時給はサーバー側でキャストのランクから自動計算される
 * クライアント側では目安として表示のみ行う
 */
export function MatchingOfferForm({
	castId,
	onSuccess,
}: MatchingOfferFormProps) {
	const { mutate, isPending } = useCreateSoloMatching()
	const { data: cast, isLoading: isCastLoading } = useCastDetail(castId)
	const [timeSelectMode, setTimeSelectMode] = useState<string>('1hour') // デフォルト1時間後

	// キャストのランクから時給を計算
	const hourlyRate = useMemo(() => {
		if (!cast) return 0
		return getHourlyRateByRank(cast.rank)
	}, [cast])

	const form = useForm<CreateSoloMatchingInput>({
		resolver: zodResolver(createSoloMatchingSchema),
		defaultValues: {
			castId,
			proposedTimeOffsetMinutes: 60, // デフォルト1時間後（60分）
			proposedDuration: 120, // デフォルト2時間
			proposedLocation: '',
		},
	})

	// 時間選択モード変更のハンドラ
	const handleTimeSelectModeChange = (value: string) => {
		setTimeSelectMode(value)

		// カスタムモード以外の場合は、proposedTimeOffsetMinutesを設定
		if (value !== 'custom') {
			const selectedOption = timeOptions.find((opt) => opt.value === value)
			if (selectedOption && selectedOption.minutes !== null) {
				form.setValue('proposedTimeOffsetMinutes', selectedOption.minutes)
				form.setValue('proposedDate', undefined)
			}
		} else {
			// カスタムモードの場合は、proposedTimeOffsetMinutesをクリア
			form.setValue('proposedTimeOffsetMinutes', undefined)
		}
	}

	// 合計ポイントを計算
	const proposedDuration = useWatch({
		control: form.control,
		name: 'proposedDuration',
	})
	const totalPoints = useMemo(() => {
		return Math.round((proposedDuration / 60) * hourlyRate)
	}, [proposedDuration, hourlyRate])

	const onSubmit = (data: CreateSoloMatchingInput) => {
		// 時給はサーバー側で計算されるため、クライアントからは送信不要
		mutate(data, {
			onSuccess: () => {
				form.reset()
				setTimeSelectMode('1hour')
				onSuccess?.()
			},
		})
	}

	// キャスト情報のローディング中
	if (isCastLoading) {
		return (
			<div className="flex items-center justify-center p-4">
				<p className="text-muted-foreground">読み込み中...</p>
			</div>
		)
	}

	// キャスト情報が取得できなかった場合
	if (!cast) {
		return (
			<div className="flex items-center justify-center p-4">
				<p className="text-destructive">キャスト情報の取得に失敗しました</p>
			</div>
		)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				{/* 開始時刻選択モード */}
				<div className="space-y-2">
					<FormLabel>希望開始時刻</FormLabel>
					<Select
						value={timeSelectMode}
						onValueChange={handleTimeSelectModeChange}
					>
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
								<FormDescription>
									希望の日時を直接指定してください
								</FormDescription>
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

				{/* ランク別時給表示（読み取り専用） */}
				<div className="rounded-lg border bg-muted/50 p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-muted-foreground">キャストランク</p>
							<p className="font-medium">{getRankName(cast.rank)}</p>
						</div>
						<div className="text-right">
							<p className="text-sm text-muted-foreground">時給</p>
							<p className="font-medium">
								{hourlyRate.toLocaleString()}ポイント/時間
							</p>
						</div>
					</div>
				</div>

				{/* 合計ポイント表示 */}
				<div className="rounded-lg bg-muted p-4">
					<p className="text-sm font-medium">合計ポイント</p>
					<p className="text-2xl font-bold">
						{totalPoints.toLocaleString()}ポイント
					</p>
				</div>

				{/* 送信ボタン */}
				<Button type="submit" className="w-full" disabled={isPending}>
					{isPending ? '送信中...' : 'オファーを送信'}
				</Button>
			</form>
		</Form>
	)
}
