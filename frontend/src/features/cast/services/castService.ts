import { eq, sql } from 'drizzle-orm'
import { db } from '@/libs/db'
import { castProfiles } from '@/libs/db/schema/cast-profiles'
import { userProfiles } from '@/libs/db/schema/users'
import { areas } from '@/libs/db/schema/areas'
import type { CastListItem, CastDetail } from '@/features/cast/types'
import { calculateAge } from '@/utils/date'

/**
 * キャストサービス
 * キャスト関連のデータベース操作を提供
 */
export const castService = {
  /**
   * アクティブなキャスト一覧を取得（ページネーション対応）
   * @param options - ページネーションオプション
   * @returns キャスト一覧と総数
   */
  async getCastList(options: { page: number; limit: number }) {
    const { page, limit } = options
    const offset = (page - 1) * limit

    // キャスト一覧を取得
    const casts = await db
      .select({
        id: castProfiles.id,
        name: userProfiles.name,
        birthDate: userProfiles.birthDate,
        bio: castProfiles.bio,
        rank: castProfiles.rank,
        areaName: areas.name,
      })
      .from(castProfiles)
      .innerJoin(userProfiles, eq(castProfiles.id, userProfiles.id))
      .leftJoin(areas, eq(castProfiles.areaId, areas.id))
      .where(eq(castProfiles.isActive, true))
      .limit(limit)
      .offset(offset)
      .orderBy(castProfiles.createdAt)

    // 総数を取得
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(castProfiles)
      .where(eq(castProfiles.isActive, true))

    // 年齢を計算
    const castsWithAge: CastListItem[] = casts.map((cast) => {
      const age = calculateAge(new Date(cast.birthDate))

      return {
        id: cast.id,
        name: cast.name,
        age,
        bio: cast.bio,
        rank: cast.rank,
        areaName: cast.areaName,
      }
    })

    return {
      casts: castsWithAge,
      total: count,
    }
  },

  /**
   * キャスト詳細を取得
   * @param castId - キャストID
   * @returns キャスト詳細情報（存在しない場合はnull）
   */
  async getCastById(castId: string): Promise<CastDetail | null> {
    const [cast] = await db
      .select({
        id: castProfiles.id,
        name: userProfiles.name,
        birthDate: userProfiles.birthDate,
        bio: castProfiles.bio,
        rank: castProfiles.rank,
        areaName: areas.name,
      })
      .from(castProfiles)
      .innerJoin(userProfiles, eq(castProfiles.id, userProfiles.id))
      .leftJoin(areas, eq(castProfiles.areaId, areas.id))
      .where(eq(castProfiles.id, castId))
      .limit(1)

    if (!cast) {
      return null
    }

    const age = calculateAge(new Date(cast.birthDate))

    return {
      id: cast.id,
      name: cast.name,
      age,
      bio: cast.bio,
      rank: cast.rank,
      areaName: cast.areaName,
    }
  },
}
