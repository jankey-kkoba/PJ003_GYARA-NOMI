import { z } from 'zod'

/**
 * キャスト一覧取得のクエリパラメータスキーマ
 */
export const castListQuerySchema = z.object({
  /**
   * ページ番号（1以上）
   */
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => Number(val))
    .pipe(z.number().int().min(1, 'ページ番号は1以上である必要があります')),

  /**
   * 1ページあたりの表示件数（1〜100）
   */
  limit: z
    .string()
    .optional()
    .default('12')
    .transform((val) => Number(val))
    .pipe(
      z
        .number()
        .int()
        .min(1, '表示件数は1以上である必要があります')
        .max(100, '表示件数は100以下である必要があります')
    ),
})

/**
 * キャスト一覧取得のクエリパラメータ型
 */
export type CastListQuery = z.infer<typeof castListQuerySchema>
