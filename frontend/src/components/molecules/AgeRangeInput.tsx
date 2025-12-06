'use client'

import { Input } from '@/components/ui/input'

/**
 * 年齢範囲の値
 */
export type AgeRangeValue = {
	minAge?: number
	maxAge?: number
}

type AgeRangeInputProps = {
	/** 最小年齢の値 */
	minAge?: number | string
	/** 最大年齢の値 */
	maxAge?: number | string
	/** 最小年齢変更時のコールバック */
	onMinAgeChange: (value: number | undefined) => void
	/** 最大年齢変更時のコールバック */
	onMaxAgeChange: (value: number | undefined) => void
	/** 最小年齢のプレースホルダー */
	minPlaceholder?: string
	/** 最大年齢のプレースホルダー */
	maxPlaceholder?: string
	/** 無効状態 */
	disabled?: boolean
}

/**
 * 年齢範囲入力コンポーネント
 * minAge〜maxAgeの範囲を入力するためのUI
 */
export function AgeRangeInput({
	minAge,
	maxAge,
	onMinAgeChange,
	onMaxAgeChange,
	minPlaceholder = '18',
	maxPlaceholder = '99',
	disabled = false,
}: AgeRangeInputProps) {
	const handleMinAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		onMinAgeChange(value ? Number(value) : undefined)
	}

	const handleMaxAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		onMaxAgeChange(value ? Number(value) : undefined)
	}

	return (
		<div className="flex items-center gap-2">
			<Input
				type="number"
				placeholder={minPlaceholder}
				min={18}
				max={99}
				value={minAge ?? ''}
				onChange={handleMinAgeChange}
				disabled={disabled}
				className="w-24"
			/>
			<span className="text-muted-foreground">〜</span>
			<Input
				type="number"
				placeholder={maxPlaceholder}
				min={18}
				max={99}
				value={maxAge ?? ''}
				onChange={handleMaxAgeChange}
				disabled={disabled}
				className="w-24"
			/>
			<span className="text-muted-foreground">歳</span>
		</div>
	)
}
