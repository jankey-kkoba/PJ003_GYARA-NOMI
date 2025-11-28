'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePhotos } from '@/features/cast-profile-photo/hooks/usePhotos'
import { useDeletePhoto } from '@/features/cast-profile-photo/hooks/useDeletePhoto'
import { SectionLoading } from '@/components/molecules/SectionLoading'

type PhotoGalleryProps = {
	/** キャストID */
	castId: string
	/** 削除可能かどうか（自分のプロフィールの場合のみtrue） */
	canDelete?: boolean
}

/**
 * プロフィール写真ギャラリーコンポーネント
 * 写真一覧をグリッド表示し、削除機能を提供
 */
export function PhotoGallery({ castId, canDelete = false }: PhotoGalleryProps) {
	const { data: photos, isLoading, error } = usePhotos(castId)
	const deleteMutation = useDeletePhoto()

	/**
	 * 写真削除ハンドラー
	 */
	const handleDelete = async (photoId: string) => {
		if (!confirm('この写真を削除しますか？')) return

		try {
			await deleteMutation.mutateAsync(photoId)
		} catch (error) {
			alert(error instanceof Error ? error.message : '写真の削除に失敗しました')
		}
	}

	if (isLoading) {
		return <SectionLoading minHeight="min-h-[200px]" />
	}

	if (error) {
		return (
			<div className="flex items-center justify-center py-8">
				<p className="text-destructive">
					{error.message || '写真の読み込みに失敗しました'}
				</p>
			</div>
		)
	}

	if (!photos || photos.length === 0) {
		return (
			<div className="flex items-center justify-center py-8">
				<p className="text-muted-foreground">写真がまだ登録されていません</p>
			</div>
		)
	}

	return (
		<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
			{photos.map((photo) => (
				<Card key={photo.id} className="overflow-hidden">
					<CardContent className="p-0">
						<div className="relative aspect-square">
							<Image
								src={photo.publicUrl}
								alt={`プロフィール写真 ${photo.displayOrder + 1}`}
								fill
								className="object-cover"
								unoptimized
							/>
							{canDelete && (
								<Button
									variant="destructive"
									size="sm"
									className="absolute bottom-2 right-2 z-10"
									onClick={() => handleDelete(photo.id)}
									disabled={deleteMutation.isPending}
								>
									削除
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	)
}
