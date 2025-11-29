'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { useCastDetail } from '@/features/cast/hooks/useCastDetail'
import { FavoriteButton } from '@/features/favorite/components/atoms/FavoriteButton'
import { PhotoGallery } from '@/features/cast-profile-photo/components/molecules/PhotoGallery'
import { CastDetailSkeleton } from '@/features/cast/components/molecules/CastDetailSkeleton'
import { ROUTES } from '@/libs/constants/routes'

type CastDetailTemplateProps = {
	castId: string
}

/**
 * キャスト詳細画面テンプレート
 */
export function CastDetailTemplate({ castId }: CastDetailTemplateProps) {
	const router = useRouter()
	const { data: cast, isLoading, error } = useCastDetail(castId)

	if (isLoading) {
		return <CastDetailSkeleton />
	}

	if (error || !cast) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4">
				<p className="text-destructive">
					{error?.message || 'キャストが見つかりません'}
				</p>
				<Button variant="outline" onClick={() => router.back()}>
					戻る
				</Button>
			</div>
		)
	}

	return (
		<div className="container max-w-2xl mx-auto py-6 px-4">
			{/* 戻るボタン */}
			<Button variant="ghost" onClick={() => router.back()} className="mb-4">
				← 一覧に戻る
			</Button>

			<Card>
				{/* プロフィール情報 */}
				<CardHeader>
					<div className="flex items-start justify-between">
						<div>
							<CardTitle className="text-2xl">{cast.name}</CardTitle>
							<CardDescription className="text-lg">
								{cast.age}歳 {cast.areaName && `・ ${cast.areaName}`}
							</CardDescription>
						</div>
						<FavoriteButton castId={castId} />
					</div>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* 写真ギャラリー */}
					<div>
						<h3 className="font-semibold text-sm text-muted-foreground mb-3">
							プロフィール写真
						</h3>
						<PhotoGallery castId={castId} canDelete={false} />
					</div>

					{/* 自己紹介 */}
					{cast.bio && (
						<div>
							<h3 className="font-semibold text-sm text-muted-foreground mb-2">
								自己紹介
							</h3>
							<p className="whitespace-pre-wrap">{cast.bio}</p>
						</div>
					)}

					{/* チャットボタン */}
					<div className="pt-4">
						<Button asChild className="w-full" size="lg">
							<Link href={ROUTES.CASTS.CHAT(castId)}>チャットする</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
