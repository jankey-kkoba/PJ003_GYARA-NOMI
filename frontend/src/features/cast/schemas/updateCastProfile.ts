import { z } from 'zod'

/**
 * キャストプロフィール更新スキーマ
 * cast_profilesテーブルの更新に使用
 */
export const updateCastProfileSchema = z.object({
  /** 自己紹介 */
  bio: z.string().max(1000, '自己紹介は1000文字以内で入力してください').nullable().optional(),
  /** エリアID */
  areaId: z.string().nullable().optional(),
})

export type UpdateCastProfileInput = z.infer<typeof updateCastProfileSchema>
