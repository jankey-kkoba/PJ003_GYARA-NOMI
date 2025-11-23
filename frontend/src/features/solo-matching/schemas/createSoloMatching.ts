import { z } from 'zod'

/**
 * ソロマッチングオファー作成のバリデーションスキーマ
 */
export const createSoloMatchingSchema = z.object({
  /** キャストID */
  castId: z.string().min(1, 'キャストIDは必須です'),
  /** 提案日時（ISO8601形式） */
  proposedDate: z.string().datetime('有効な日時を指定してください'),
  /** 提案時間（分） */
  proposedDuration: z
    .number()
    .int('整数で指定してください')
    .min(30, '最低30分から指定できます')
    .max(480, '最大8時間まで指定できます'),
  /** 提案場所 */
  proposedLocation: z.string().min(1, '場所は必須です').max(200, '場所は200文字以内で入力してください'),
  /** 時給（ポイント） */
  hourlyRate: z.number().int('整数で指定してください').min(1000, '最低1000ポイントから指定できます'),
})

export type CreateSoloMatchingInput = z.infer<typeof createSoloMatchingSchema>
