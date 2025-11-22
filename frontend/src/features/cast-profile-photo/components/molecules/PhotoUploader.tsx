'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUploadPhoto } from '@/features/cast-profile-photo/hooks/useUploadPhoto'
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_IMAGE_TYPES_ACCEPT,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_MB,
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
 * ファイル選択、プレビュー、アップロード機能を提供
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
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* ファイル選択 */}
          <div className="space-y-2">
            <Label htmlFor="photo-upload">写真を選択</Label>
            <Input
              id="photo-upload"
              type="file"
              accept={ALLOWED_IMAGE_TYPES_ACCEPT}
              onChange={handleFileSelect}
              ref={fileInputRef}
              disabled={uploadMutation.isPending}
            />
            <p className="text-sm text-muted-foreground">
              PNG、JPEG、WEBP形式、{MAX_FILE_SIZE_MB}MB以下
            </p>
          </div>

          {/* プレビュー */}
          {previewUrl && (
            <div className="space-y-2">
              <Label>プレビュー</Label>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <Image
                  src={previewUrl}
                  alt="プレビュー"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          )}

          {/* エラーメッセージ */}
          {uploadMutation.isError && (
            <p className="text-sm text-destructive">
              {uploadMutation.error?.message || 'アップロードに失敗しました'}
            </p>
          )}

          {/* アクションボタン */}
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="flex-1"
            >
              {uploadMutation.isPending ? 'アップロード中...' : 'アップロード'}
            </Button>
            {selectedFile && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={uploadMutation.isPending}
              >
                キャンセル
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
