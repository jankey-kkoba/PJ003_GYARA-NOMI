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
import { Label } from '@/components/ui/label'
import { AgeRangeInput } from '@/components/molecules/AgeRangeInput'
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
	const [minAge, setMinAge] = useState<number | undefined>(values.minAge)
	const [maxAge, setMaxAge] = useState<number | undefined>(values.maxAge)

	const handleApply = () => {
		onApply({
			minAge,
			maxAge,
		})
		setOpen(false)
	}

	const handleReset = () => {
		setMinAge(undefined)
		setMaxAge(undefined)
		onApply({})
		setOpen(false)
	}

	// フィルターが適用されているかどうか
	const hasActiveFilter =
		values.minAge !== undefined || values.maxAge !== undefined

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
						<AgeRangeInput
							minAge={minAge}
							maxAge={maxAge}
							onMinAgeChange={setMinAge}
							onMaxAgeChange={setMaxAge}
						/>
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
