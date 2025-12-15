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
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useCreateGroupMatching } from '@/features/group-matching/hooks/useCreateGroupMatching'
import {
	createGroupMatchingSchema,
	type CreateGroupMatchingInput,
} from '@/features/group-matching/schemas/createGroupMatching'
import { useMemo, useState } from 'react'
import { RANK_HOURLY_RATES } from '@/features/cast/constants'
import { calculatePoints } from '@/utils/points'

/**
 * GroupMatchingOfferFormのProps
 */
type GroupMatchingOfferFormProps = {
	/** 送信成功時のコールバック */
	onSuccess?: (participantCount: number) => void
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
 * 人数選択肢（1〜10人）
 */
const castCountOptions = Array.from({ length: 10 }, (_, i) => ({
	value: i + 1,
	label: `${i + 1}人`,
}))

/**
 * グループマッチングオファー送信フォーム
 * 希望人数とソロマッチングと共通の基本項目を入力
 */
export function GroupMatchingOfferForm({
	onSuccess,
}: GroupMatchingOfferFormProps) {
	const { mutate, isPending } = useCreateGroupMatching()
	const [timeSelectMode, setTimeSelectMode] = useState<string>('1hour')
	const [showNoCastsDialog, setShowNoCastsDialog] = useState(false)

	// ブロンズランク（ランク1）の時給を基準に表示
	const baseHourlyRate = RANK_HOURLY_RATES[1]

	const form = useForm<CreateGroupMatchingInput>({
		resolver: zodResolver(createGroupMatchingSchema),
		defaultValues: {
			requestedCastCount: 2, // デフォルト2人
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
	const requestedCastCount = useWatch({
		control: form.control,
		name: 'requestedCastCount',
	})
	const totalPoints = useMemo(() => {
		return (
			calculatePoints(proposedDuration, baseHourlyRate) * requestedCastCount
		)
	}, [proposedDuration, requestedCastCount, baseHourlyRate])

	const onSubmit = (data: CreateGroupMatchingInput) => {
		mutate(data, {
			onSuccess: (result) => {
				// 条件に合うキャストが0人の場合
				if (result.participantCount === 0) {
					setShowNoCastsDialog(true)
					return
				}

				form.reset()
				setTimeSelectMode('1hour')
				onSuccess?.(result.participantCount)
			},
		})
	}

	return (
		<>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					{/* 希望人数 */}
					<FormField
						control={form.control}
						name="requestedCastCount"
						render={({ field }) => (
							<FormItem>
								<FormLabel>希望人数</FormLabel>
								<Select
									onValueChange={(value) => field.onChange(Number(value))}
									defaultValue={String(field.value)}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="人数を選択" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{castCountOptions.map((option) => (
											<SelectItem
												key={option.value}
												value={String(option.value)}
											>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormDescription>
									呼びたいキャストの人数を選択してください
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

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
											<SelectItem
												key={option.value}
												value={String(option.value)}
											>
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

					{/* 料金説明 */}
					<div className="rounded-lg border bg-muted/50 p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">基準時給</p>
								<p className="font-medium">
									{baseHourlyRate.toLocaleString()}ポイント/時間/人
								</p>
							</div>
							<div className="text-right">
								<p className="text-sm text-muted-foreground">
									※ブロンズランク基準
								</p>
							</div>
						</div>
					</div>

					{/* 合計ポイント表示 */}
					<div className="rounded-lg bg-muted p-4">
						<p className="text-sm font-medium">合計ポイント（目安）</p>
						<p className="text-2xl font-bold">
							{totalPoints.toLocaleString()}ポイント
						</p>
						<p className="text-xs text-muted-foreground">
							※実際の料金はマッチングしたキャストのランクにより変動します
						</p>
					</div>

					{/* 送信ボタン */}
					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? '送信中...' : 'オファーを送信'}
					</Button>
				</form>
			</Form>

			{/* 該当キャストがいない場合のダイアログ */}
			<AlertDialog open={showNoCastsDialog} onOpenChange={setShowNoCastsDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>該当するキャストがいません</AlertDialogTitle>
						<AlertDialogDescription>
							指定された条件に合うキャストが見つかりませんでした。
							条件を変更して再度お試しください。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction onClick={() => setShowNoCastsDialog(false)}>
							OK
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
