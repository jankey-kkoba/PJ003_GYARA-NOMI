'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GroupMatchingOfferForm } from '@/features/group-matching/components/organisms/GroupMatchingOfferForm'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/libs/constants/routes'

/**
 * グループマッチングオファー画面テンプレート
 */
export function GroupMatchingOfferTemplate() {
	const router = useRouter()
	const { showToast } = useToast()

	const handleSuccess = (participantCount: number) => {
		showToast(
			`${participantCount}人のキャストにオファーを送信しました`,
			'success',
		)
		router.push(ROUTES.HOME)
	}

	return (
		<div className="flex min-h-screen flex-col bg-background px-4 py-8">
			<div className="mx-auto w-full max-w-md space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>グループマッチングオファー</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="mb-4 text-sm text-muted-foreground">
							希望条件を入力して、キャストにオファーを送信しましょう。
							条件に合うキャスト全員にオファーが届きます。
						</p>
						<GroupMatchingOfferForm onSuccess={handleSuccess} />
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
