'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { useRegisterUser } from '@/features/user/hooks/useRegisterUser'
import { useToast } from '@/hooks/useToast'
import {
	registerProfileSchema,
	type RegisterProfileInput,
} from '@/features/user/schemas/registerProfile'

/**
 * ユーザータイプ
 */
type UserType = 'guest' | 'cast'

/**
 * RegisterTemplateのProps
 */
type RegisterTemplateProps = {
	userType: UserType
}

/**
 * ユーザータイプに応じた表示設定
 */
const userTypeConfig = {
	guest: {
		title: 'ゲストプロフィール登録',
		description: 'ゲストとしてプロフィール情報を入力してください',
	},
	cast: {
		title: 'キャストプロフィール登録',
		description: 'キャストとしてプロフィール情報を入力してください',
	},
}

/**
 * プロフィール登録ページのテンプレート
 * LINE認証後に表示されるプロフィール入力フォーム
 */
export function RegisterTemplate({ userType }: RegisterTemplateProps) {
	const config = userTypeConfig[userType]
	const router = useRouter()
	const { showToast } = useToast()
	const { mutate, isPending } = useRegisterUser()

	const form = useForm<RegisterProfileInput>({
		resolver: zodResolver(registerProfileSchema),
		defaultValues: {
			name: '',
			birthDate: '',
			userType,
		},
	})

	const onSubmit = (data: RegisterProfileInput) => {
		mutate(data, {
			onSuccess: () => {
				showToast('プロフィール登録が完了しました。', 'success')
				router.push('/')
			},
			// エラー時はグローバルエラーハンドラーが自動的にtoastを表示するため、
			// onErrorでの個別処理は不要
		})
	}

	return (
		<div className="flex min-h-screen flex-col bg-background px-4 py-8">
			<div className="mx-auto w-full max-w-md space-y-6">
				{/* ヘッダー */}
				<div className="text-center">
					<h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						{config.description}
					</p>
				</div>

				{/* フォーム */}
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>お名前</FormLabel>
									<FormControl>
										<Input placeholder="山田太郎" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="birthDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>生年月日</FormLabel>
									<FormControl>
										<Input type="date" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							type="submit"
							className="w-full"
							size="lg"
							disabled={isPending}
						>
							{isPending ? '登録中...' : '登録する'}
						</Button>
					</form>
				</Form>

				<p className="text-center text-xs text-muted-foreground">
					入力した情報は後から変更できます
				</p>
			</div>
		</div>
	)
}
