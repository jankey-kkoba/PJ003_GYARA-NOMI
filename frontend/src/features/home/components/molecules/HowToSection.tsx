'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * ステップ情報の型
 */
type Step = {
	number: number
	title: string
	description: string
}

/**
 * 使い方の3ステップ
 */
const STEPS: Step[] = [
	{
		number: 1,
		title: '条件を入力',
		description: '日時・場所・人数を指定してキャストを募集',
	},
	{
		number: 2,
		title: 'キャストが決まる',
		description: 'オファーに応じたキャストとマッチング',
	},
	{
		number: 3,
		title: '合流して楽しむ',
		description: '指定した場所でギャラ飲みスタート',
	},
]

/**
 * ステップアイテムコンポーネント
 */
function StepItem({ step }: { step: Step }) {
	return (
		<div className="flex flex-col items-center text-center">
			<div
				className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg md:text-xl font-bold"
				aria-hidden="true"
			>
				{step.number}
			</div>
			<h4 className="mt-2 text-sm md:text-base font-semibold text-foreground">
				{step.title}
			</h4>
			<p className="mt-1 text-xs md:text-sm text-muted-foreground">
				{step.description}
			</p>
		</div>
	)
}

/**
 * 使い方セクション
 * ギャラ飲みの流れを3ステップで説明する
 */
export function HowToSection() {
	return (
		<Card>
			<CardHeader className="pb-2 md:pb-4">
				<CardTitle className="text-base md:text-lg">
					キャストを呼ぶまでの3ステップ
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div
					className="grid grid-cols-3 gap-2 md:gap-4"
					role="list"
					aria-label="利用の流れ"
				>
					{STEPS.map((step) => (
						<div key={step.number} role="listitem">
							<StepItem step={step} />
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
