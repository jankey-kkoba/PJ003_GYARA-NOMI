'use client'

import Image from 'next/image'
import { Camera } from 'lucide-react'
import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SectionLoading } from '@/components/molecules/SectionLoading'
import { usePhotos } from '@/features/cast-profile-photo/hooks/usePhotos'
import { useUploadPhoto } from '@/features/cast-profile-photo/hooks/useUploadPhoto'
import { useDeletePhoto } from '@/features/cast-profile-photo/hooks/useDeletePhoto'
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_IMAGE_TYPES_ACCEPT,
  MAX_FILE_SIZE,
  ERROR_MESSAGES,
} from '@/features/cast-profile-photo/constants'

type CastProfilePhotoManagerProps = {
  /** キャストID（現在のユーザー） */
  castId: string
}

/**
 * キャストプロフィール写真管理コンポーネント
 * マッチングアプリ風のグリッド表示で写真を統合管理
 */
export function CastProfilePhotoManager({
  castId,
}: CastProfilePhotoManagerProps) {
  const { data: photos, isLoading, error } = usePhotos(castId)
  const uploadMutation = useUploadPhoto()
  const deleteMutation = useDeletePhoto()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
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
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'アップロードに失敗しました'
      )
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

  /**
   * 写真削除ハンドラー
   */
  const handleDelete = async (photoId: string) => {
    if (!confirm('この写真を削除しますか？')) return

    try {
      await deleteMutation.mutateAsync(photoId)
    } catch (error) {
      alert(
        error instanceof Error ? error.message : '写真の削除に失敗しました'
      )
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

      {/* 写真グリッド（既存の写真 + 追加スロット or プレビュー） */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {/* 既存の写真 */}
        {photos?.map((photo) => (
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
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute bottom-2 right-2 z-10"
                  onClick={() => handleDelete(photo.id)}
                  disabled={deleteMutation.isPending}
                >
                  削除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* プレビュー or 追加スロット */}
        {previewUrl ? (
          // プレビュー表示
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <Image
                  src={previewUrl}
                  alt="プレビュー"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute bottom-2 left-2 right-2 flex gap-2 z-10">
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    className="flex-1"
                  >
                    {uploadMutation.isPending ? '追加中...' : '追加'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={uploadMutation.isPending}
                  >
                    削除
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          // 追加スロット
          <Card
            className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
            onClick={handleCameraClick}
          >
            <CardContent className="p-0">
              <div className="relative aspect-square flex flex-col items-center justify-center bg-muted">
                <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-muted-foreground text-center px-4">
                  タップして写真を追加
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* エラーメッセージ */}
      {uploadMutation.isError && (
        <p className="text-sm text-destructive">
          {uploadMutation.error?.message || 'アップロードに失敗しました'}
        </p>
      )}

      {/* ヘルプテキスト */}
      {!photos || photos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center">
          最低1枚は写真を追加してください
        </p>
      ) : null}
    </div>
  )
}
