import { eq, sql, and, gte, lte, type SQL } from 'drizzle-orm'
import { db } from '@/libs/db'
import { castProfiles } from '@/libs/db/schema/cast-profiles'
import { userProfiles } from '@/libs/db/schema/users'
import { areas } from '@/libs/db/schema/areas'
import { castProfilePhotos } from '@/libs/db/schema/cast-profile-photos'
import type { CastListItem, CastDetail } from '@/features/cast/types'
import { calculateAge, subtractYears, addDaysToDate, formatDateOnly } from '@/utils/date'
import { STORAGE_BUCKET_NAME } from '@/features/cast-profile-photo/constants'
import { NEXT_PUBLIC_SUPABASE_URL } from '@/libs/constants/env'

/**
 * Supabase Storageの公開URLを生成
 * @param photoUrl - ストレージのパス
 * @returns 公開URL
 */
function getPublicUrl(photoUrl: string): string {
  return `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET_NAME}/${photoUrl}`
}

/**
 * キャストサービス
 * キャスト関連のデータベース操作を提供
 */
export const castService = {
  /**
   * アクティブなキャスト一覧を取得（ページネーション対応）
   * @param options - ページネーション・フィルタリングオプション
   * @returns キャスト一覧と総数
   */
  async getCastList(options: {
    page: number
    limit: number
    minAge?: number
    maxAge?: number
  }) {
    const { page, limit, minAge, maxAge } = options
    const offset = (page - 1) * limit

    // WHERE条件を構築
    const conditions: SQL[] = [eq(castProfiles.isActive, true)]

    // 年齢フィルタリング（生年月日から計算）
    // minAge歳以上 = 生年月日がminAge年前の今日以前
    // maxAge歳以下 = 生年月日がmaxAge+1年前の今日より後
    const today = new Date()
    if (minAge !== undefined) {
      const maxBirthDate = subtractYears(today, minAge)
      conditions.push(lte(userProfiles.birthDate, formatDateOnly(maxBirthDate)))
    }
    if (maxAge !== undefined) {
      const minBirthDate = addDaysToDate(subtractYears(today, maxAge + 1), 1)
      conditions.push(gte(userProfiles.birthDate, formatDateOnly(minBirthDate)))
    }

    const whereClause = and(...conditions)

    // キャスト一覧を取得（代表写真も含む）
    const casts = await db
      .select({
        id: castProfiles.id,
        name: userProfiles.name,
        birthDate: userProfiles.birthDate,
        bio: castProfiles.bio,
        rank: castProfiles.rank,
        areaName: areas.name,
        thumbnailPhotoUrl: castProfilePhotos.photoUrl,
      })
      .from(castProfiles)
      .innerJoin(userProfiles, eq(castProfiles.id, userProfiles.id))
      .leftJoin(areas, eq(castProfiles.areaId, areas.id))
      .leftJoin(
        castProfilePhotos,
        and(
          eq(castProfilePhotos.castProfileId, castProfiles.id),
          eq(castProfilePhotos.displayOrder, 0)
        )
      )
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(castProfiles.createdAt)

    // 総数を取得
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(castProfiles)
      .innerJoin(userProfiles, eq(castProfiles.id, userProfiles.id))
      .where(whereClause)

    // 年齢を計算し、サムネイルURLを生成
    const castsWithAge: CastListItem[] = casts.map((cast) => {
      const age = calculateAge(new Date(cast.birthDate))
      const thumbnailUrl = cast.thumbnailPhotoUrl ? getPublicUrl(cast.thumbnailPhotoUrl) : null

      // デバッグログ
      if (cast.thumbnailPhotoUrl) {
        console.log('[castService.getCastList] Cast:', cast.id, 'photoUrl:', cast.thumbnailPhotoUrl, 'publicUrl:', thumbnailUrl)
      }

      return {
        id: cast.id,
        name: cast.name,
        age,
        bio: cast.bio,
        rank: cast.rank,
        areaName: cast.areaName,
        thumbnailUrl,
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
