import { z } from 'zod'

/**
 * プロフィール写真アップロード時のバリデーションスキーマ
 */
export const uploadPhotoSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, {
      message: '画像ファイルが必要です',
    })
    .refine(
      (file) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        return allowedTypes.includes(file.type)
      },
      {
        message: '許可されていないファイル形式です。PNG、JPEG、WEBPのいずれかを使用してください',
      }
    )
    .refine(
      (file) => {
        const maxSize = 5 * 1024 * 1024 // 5MB
        return file.size <= maxSize
      },
      {
        message: 'ファイルサイズは5MB以下にしてください',
      }
    ),
})

/**
 * プロフィール写真の表示順更新時のバリデーションスキーマ
 */
export const updatePhotoSchema = z.object({
  displayOrder: z.number({
    message: 'displayOrderは数値である必要があります',
  }),
})

export type UploadPhotoInput = z.infer<typeof uploadPhotoSchema>
export type UpdatePhotoInput = z.infer<typeof updatePhotoSchema>
