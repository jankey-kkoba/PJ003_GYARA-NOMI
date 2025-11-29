'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormDescription,
} from '@/components/ui/form'
import { useCreateCastReview } from '@/features/cast-review/hooks/useCastReview'
import {
	createCastReviewSchema,
	type CreateCastReviewInput,
} from '@/features/cast-review/schemas/createCastReview'
import { StarRating } from '@/features/cast-review/components/molecules/StarRating'

/**
 * CastReviewFormのProps
 */
type CastReviewFormProps = {
	/** マッチングID */
	matchingId: string
	/** 送信成功時のコールバック */
	onSuccess?: () => void
}

/**
 * キャスト評価フォーム
 */
export function CastReviewForm({ matchingId, onSuccess }: CastReviewFormProps) {
	const { mutate, isPending } = useCreateCastReview()

	const form = useForm<CreateCastReviewInput>({
		resolver: zodResolver(createCastReviewSchema),
		defaultValues: {
			matchingId,
			rating: 0,
			comment: '',
		},
	})

	// 評価値を監視（送信ボタンの有効/無効判定用）
	const rating = useWatch({ control: form.control, name: 'rating' })

	const onSubmit = (data: CreateCastReviewInput) => {
		mutate(data, {
			onSuccess: () => {
				form.reset()
				onSuccess?.()
			},
		})
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				{/* 星評価 */}
				<FormField
					control={form.control}
					name="rating"
					render={({ field }) => (
						<FormItem>
							<FormLabel>評価</FormLabel>
							<FormControl>
								<StarRating
									value={field.value}
									onChange={field.onChange}
									disabled={isPending}
								/>
							</FormControl>
							<FormDescription>
								キャストの対応を1〜5段階で評価してください
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* コメント */}
				<FormField
					control={form.control}
					name="comment"
					render={({ field }) => (
						<FormItem>
							<FormLabel>コメント（任意）</FormLabel>
							<FormControl>
								<Textarea
									placeholder="キャストへの感想やコメントがあればご記入ください"
									className="resize-none"
									rows={4}
									{...field}
								/>
							</FormControl>
							<FormDescription>500文字以内</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* 送信ボタン */}
				<Button
					type="submit"
					className="w-full"
					disabled={isPending || rating === 0}
				>
					{isPending ? '送信中...' : '評価を送信'}
				</Button>
			</form>
		</Form>
	)
}
