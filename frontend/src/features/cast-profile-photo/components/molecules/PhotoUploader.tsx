'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useUploadPhoto } from '@/features/cast-profile-photo/hooks/useUploadPhoto'
import {
	ALLOWED_IMAGE_TYPES,
	ALLOWED_IMAGE_TYPES_ACCEPT,
	MAX_FILE_SIZE,
	ERROR_MESSAGES,
} from '@/features/cast-profile-photo/constants'

type PhotoUploaderProps = {
	/** アップロード成功時のコールバック */
	onUploadSuccess?: () => void
	/** アップロード失敗時のコールバック */
	onUploadError?: (error: Error) => void
}

/**
 * プロフィール写真アップロードコンポーネント
 * マッチングアプリ風のカメラアイコンをクリックしてアップロードするUI
 */
export function PhotoUploader({
	onUploadSuccess,
	onUploadError,
}: PhotoUploaderProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [previewUrl, setPreviewUrl] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const uploadMutation = useUploadPhoto()

	/**
	 * カメラアイコンクリックハンドラー
	 */
	const handleCameraClick = () => {
		fileInputRef.current?.click()
	}

	/**
	 * ファイル選択ハンドラー
	 */
	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		// ファイルタイプチェック
		if (
			!ALLOWED_IMAGE_TYPES.includes(
				file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
			)
		) {
			alert(ERROR_MESSAGES.INVALID_FILE_TYPE)
			return
		}

		// ファイルサイズチェック
		if (file.size > MAX_FILE_SIZE) {
			alert(ERROR_MESSAGES.FILE_TOO_LARGE)
			return
		}

		setSelectedFile(file)

		// プレビュー生成
		const reader = new FileReader()
		reader.onloadend = () => {
			setPreviewUrl(reader.result as string)
		}
		reader.readAsDataURL(file)
	}

	/**
	 * アップロード実行ハンドラー
	 */
	const handleUpload = async () => {
		if (!selectedFile) return

		try {
			await uploadMutation.mutateAsync(selectedFile)
			// 成功時の処理
			setSelectedFile(null)
			setPreviewUrl(null)
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
			onUploadSuccess?.()
		} catch (error) {
			onUploadError?.(error as Error)
		}
	}

	/**
	 * 選択キャンセルハンドラー
	 */
	const handleCancel = () => {
		setSelectedFile(null)
		setPreviewUrl(null)
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	return (
		<div className="space-y-4">
			{/* 隠しファイル入力 */}
			<input
				ref={fileInputRef}
				type="file"
				accept={ALLOWED_IMAGE_TYPES_ACCEPT}
				onChange={handleFileSelect}
				className="hidden"
				disabled={uploadMutation.isPending}
			/>

			{/* カメラアイコン付き写真スロット（マッチングアプリ風UI） */}
			{!previewUrl && (
				<Card
					className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
					onClick={handleCameraClick}
				>
					<CardContent className="p-0">
						<div className="relative aspect-square flex flex-col items-center justify-center bg-muted">
							<Camera className="h-12 w-12 text-muted-foreground mb-2" />
							<p className="text-sm font-medium text-muted-foreground">
								タップして写真を追加
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								PNG, JPEG, WEBP
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* プレビュー表示 */}
			{previewUrl && (
				<Card>
					<CardContent className="p-0">
						<div className="relative aspect-square w-full overflow-hidden rounded-lg">
							<Image
								src={previewUrl}
								alt="プレビュー"
								fill
								className="object-cover"
								unoptimized
							/>
						</div>
					</CardContent>
				</Card>
			)}

			{/* エラーメッセージ */}
			{uploadMutation.isError && (
				<p className="text-sm text-destructive">
					{uploadMutation.error?.message || 'アップロードに失敗しました'}
				</p>
			)}

			{/* アクションボタン（プレビュー時のみ表示） */}
			{selectedFile && (
				<div className="flex gap-2">
					<Button
						onClick={handleUpload}
						disabled={uploadMutation.isPending}
						className="flex-1"
					>
						{uploadMutation.isPending ? 'アップロード中...' : 'この写真を追加'}
					</Button>
					<Button
						variant="outline"
						onClick={handleCancel}
						disabled={uploadMutation.isPending}
					>
						キャンセル
					</Button>
				</div>
			)}
		</div>
	)
}
