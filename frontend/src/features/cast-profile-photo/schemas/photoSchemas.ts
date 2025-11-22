import { z } from 'zod'
import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  ERROR_MESSAGES,
} from '@/features/cast-profile-photo/constants'

/**
 * プロフィール写真アップロード時のバリデーションスキーマ
 */
export const uploadPhotoSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, {
      message: ERROR_MESSAGES.FILE_REQUIRED,
    })
    .refine(
      (file) => {
        return ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])
      },
      {
        message: ERROR_MESSAGES.INVALID_FILE_TYPE,
      }
    )
    .refine(
      (file) => {
        return file.size <= MAX_FILE_SIZE
      },
      {
        message: ERROR_MESSAGES.FILE_TOO_LARGE,
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
